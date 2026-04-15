"""
AI Text Analyzer for Financial Documents
Using Instructor + Qwen 2.5 for guaranteed structured extraction
Architecture: OCR → Raw Text → Instructor + Qwen 2.5 → Validated Pydantic Model → JSON Output
"""

import os
import json
import logging
import asyncio
import aiohttp
import re
from typing import Dict, List, Optional, Any
from datetime import datetime
from dataclasses import dataclass, asdict
from enum import Enum
from pydantic import BaseModel, Field
import instructor
from openai import OpenAI

logger = logging.getLogger(__name__)

# ==================== CONFIGURATION ====================

# OpenRouter Configuration (Secondary/Backup)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "stepfun/step-3.5-flash")

# Ollama Configuration (Primary with Instructor)
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")

# Provider settings
ENABLE_OLLAMA = os.getenv("ENABLE_OLLAMA", "true").lower() == "true"
ENABLE_OPENROUTER = os.getenv("ENABLE_OPENROUTER", "true").lower() == "true"
ENABLE_REGEX_FALLBACK = os.getenv("ENABLE_REGEX_FALLBACK", "true").lower() == "true"

SITE_URL = os.getenv("SITE_URL", "http://localhost:8000")
SITE_NAME = os.getenv("SITE_NAME", "Finance OCR Service")

# ==================== PYDANTIC MODELS (For Instructor) ====================

class DocumentType(str, Enum):
    """Document types"""
    BANK_RECEIPT = "bank_receipt"
    HOTEL_RECEIPT = "hotel_receipt"
    RESTAURANT_RECEIPT = "restaurant_receipt"
    RETAIL_RECEIPT = "retail_receipt"
    INVOICE = "invoice"
    UNKNOWN = "unknown"

class MerchantInfo(BaseModel):
    """Merchant/Business information"""
    name: Optional[str] = Field(None, description="Business/merchant/store name exactly as written")
    address: Optional[str] = Field(None, description="Complete address including street, city, pin code")
    phone: Optional[str] = Field(None, description="Phone number with area code")
    gst: Optional[str] = Field(None, description="GST number if present")

class TransactionInfo(BaseModel):
    """Transaction information"""
    transaction_id: Optional[str] = Field(None, description="Transaction/reference/order ID")
    invoice_number: Optional[str] = Field(None, description="Invoice/bill number")
    date: Optional[str] = Field(None, description="Transaction date in YYYY-MM-DD format")
    time: Optional[str] = Field(None, description="Transaction time in HH:MM:SS format")

class FinancialDetails(BaseModel):
    """Financial amount details"""
    subtotal: Optional[float] = Field(None, description="Amount before tax")
    tax: Optional[float] = Field(None, description="Total tax amount")
    gst: Optional[float] = Field(None, description="Total GST amount")
    cgst: Optional[float] = Field(None, description="CGST amount")
    sgst: Optional[float] = Field(None, description="SGST amount")
    igst: Optional[float] = Field(None, description="IGST amount")
    discount: Optional[float] = Field(None, description="Discount amount")
    total: Optional[float] = Field(None, description="Final total amount")
    amount_paid: Optional[float] = Field(None, description="Amount actually paid")
    currency: str = Field("INR", description="Currency code")

class PaymentInfo(BaseModel):
    """Payment information"""
    method: Optional[str] = Field(None, description="Payment method (cash, card, upi, netbanking)")
    card_last4: Optional[str] = Field(None, description="Last 4 digits of card if used")
    bank_name: Optional[str] = Field(None, description="Bank name if mentioned")
    upi_id: Optional[str] = Field(None, description="UPI ID if UPI payment used")

class HotelDetails(BaseModel):
    """Hotel-specific details"""
    room_number: Optional[str] = Field(None, description="Room number")
    guest_name: Optional[str] = Field(None, description="Guest name")
    check_in: Optional[str] = Field(None, description="Check-in date")
    check_out: Optional[str] = Field(None, description="Check-out date")
    number_of_nights: Optional[int] = Field(None, description="Number of nights")

class ReceiptData(BaseModel):
    """Complete receipt data - Main model for Instructor"""
    document_type: DocumentType = Field(DocumentType.UNKNOWN, description="Type of document")
    merchant: MerchantInfo = Field(default_factory=MerchantInfo)
    transaction: TransactionInfo = Field(default_factory=TransactionInfo)
    financial: FinancialDetails = Field(default_factory=FinancialDetails)
    payment: PaymentInfo = Field(default_factory=PaymentInfo)
    hotel_details: Optional[HotelDetails] = Field(None, description="Hotel specific details")
    confidence_score: float = Field(0.0, description="Overall confidence score 0-100")

# ==================== LEGACY FINANCIAL DATA (For backward compatibility) ====================

@dataclass
class FinancialData:
    """Structured financial data extracted from document (Legacy format)"""
    document_type: str = "unknown"
    merchant_name: Optional[str] = None
    merchant_address: Optional[str] = None
    merchant_phone: Optional[str] = None
    merchant_gst: Optional[str] = None
    transaction_id: Optional[str] = None
    invoice_number: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    room_number: Optional[str] = None
    guest_name: Optional[str] = None
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    total_amount: Optional[float] = None
    amount_paid: Optional[float] = None
    balance_due: Optional[float] = None
    currency: str = "INR"
    payment_method: Optional[str] = None
    card_number_last4: Optional[str] = None
    bank_name: Optional[str] = None
    customer_name: Optional[str] = None
    items: List[Dict] = None
    raw_text: str = ""
    confidence_score: float = 0.0
    provider_used: str = "none"
    
    def __post_init__(self):
        if self.items is None:
            self.items = []

@dataclass
class AIAnalysisResult:
    success: bool
    extracted_data: Optional[FinancialData]
    raw_response: str
    processing_time: float
    provider: str
    error: Optional[str] = None

# ==================== INSTRUCTOR + OLLAMA PROVIDER ====================

class InstructorOllamaProvider:
    """
    Primary: Instructor + Ollama with Qwen 2.5
    This guarantees structured JSON output with proper validation
    """
    
    def __init__(self):
        self.name = "instructor_ollama"
        self.client = None
        self._init_client()
    
    def _init_client(self):
        """Initialize the Instructor client with Ollama"""
        try:
            # Create OpenAI-compatible client for Ollama
            base_client = OpenAI(
                base_url=f"{OLLAMA_BASE_URL}/v1",
                api_key="ollama",  # Required but ignored
                timeout=120.0
            )
            # Wrap with Instructor for structured output
            self.client = instructor.from_openai(
                base_client,
                mode=instructor.Mode.JSON
            )
            logger.info(f"Instructor + Ollama initialized with model: {OLLAMA_MODEL}")
        except Exception as e:
            logger.error(f"Failed to initialize Instructor + Ollama: {e}")
            self.client = None
    
    def _convert_to_legacy_format(self, receipt_data: ReceiptData, raw_text: str) -> FinancialData:
        """Convert Pydantic model to legacy FinancialData format"""
        result = FinancialData(
            document_type=receipt_data.document_type.value,
            raw_text=raw_text[:500],
            provider_used=self.name,
            confidence_score=receipt_data.confidence_score
        )
        
        # Merchant info
        if receipt_data.merchant:
            result.merchant_name = receipt_data.merchant.name
            result.merchant_address = receipt_data.merchant.address
            result.merchant_phone = receipt_data.merchant.phone
            result.merchant_gst = receipt_data.merchant.gst
        
        # Transaction info
        if receipt_data.transaction:
            result.transaction_id = receipt_data.transaction.transaction_id
            result.invoice_number = receipt_data.transaction.invoice_number
            result.date = receipt_data.transaction.date
            result.time = receipt_data.transaction.time
        
        # Financial details
        if receipt_data.financial:
            result.subtotal = receipt_data.financial.subtotal
            result.tax = receipt_data.financial.tax
            result.total_amount = receipt_data.financial.total
            result.amount_paid = receipt_data.financial.amount_paid
            result.currency = receipt_data.financial.currency
        
        # Payment info
        if receipt_data.payment:
            result.payment_method = receipt_data.payment.method
            result.card_number_last4 = receipt_data.payment.card_last4
            result.bank_name = receipt_data.payment.bank_name
        
        # Hotel details
        if receipt_data.hotel_details:
            result.room_number = receipt_data.hotel_details.room_number
            result.guest_name = receipt_data.hotel_details.guest_name
        
        return result
    
    async def analyze(self, text: str) -> tuple:
        """
        Analyze text using Instructor + Ollama
        Returns (response_json, error)
        """
        if not self.client:
            return None, "Instructor client not initialized"
        
        try:
            # Create the prompt for extraction
            prompt = self._create_extraction_prompt(text)
            
            # Use Instructor to force structured output
            response = self.client.chat.completions.create(
                model=OLLAMA_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert financial document extractor. Extract information exactly as shown in the text. Preserve original formatting, case, and spelling."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                response_model=ReceiptData,  # This forces the output to match our schema
                temperature=0.0,  # Zero randomness for exact extraction
                max_retries=2  # Auto-retry on validation failure
            )
            
            # Convert to legacy format
            legacy_data = self._convert_to_legacy_format(response, text)
            
            # Return as JSON string for compatibility
            return json.dumps(asdict(legacy_data)), None
            
        except Exception as e:
            logger.error(f"Instructor extraction failed: {e}")
            return None, str(e)
    
    def _create_extraction_prompt(self, text: str) -> str:
        """Create the extraction prompt"""
        return f"""Extract ALL available information from this financial receipt. Copy values EXACTLY as they appear.

OCR TEXT:
{text[:8000]}

INSTRUCTIONS:
1. Copy text EXACTLY as written (preserve case, spelling, special characters)
2. For dates, convert to YYYY-MM-DD format
3. For amounts, extract as numbers (remove commas and spaces)
4. If information is not present, leave as null
5. Detect document type: bank_receipt, hotel_receipt, restaurant_receipt, or retail_receipt

Extract all relevant fields into the provided schema."""

# ==================== FALLBACK PROVIDERS ====================

class OpenRouterProvider:
    """Secondary: OpenRouter API provider (fallback if Instructor fails)"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.name = "openrouter"
        
    async def analyze(self, prompt: str, session: aiohttp.ClientSession) -> tuple:
        if not self.api_key:
            return None, "No API key"
        
        try:
            payload = {
                "model": OPENROUTER_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.0,
                "max_tokens": 2000
            }
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            async with session.post(OPENROUTER_BASE_URL, json=payload, headers=headers, timeout=120) as response:
                if response.status == 200:
                    result = await response.json()
                    content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                    return content, None
                return None, f"HTTP {response.status}"
                    
        except Exception as e:
            return None, str(e)

class RegexProvider:
    """Tertiary: Regex fallback (last resort)"""
    
    def __init__(self):
        self.name = "regex"
        
    async def analyze(self, text: str) -> tuple:
        result = self._extract_with_regex(text)
        return result, None
    
    def _extract_with_regex(self, text: str) -> str:
        data = {
            "document_type": "bank_receipt",
            "merchant_name": None,
            "merchant_address": None,
            "merchant_phone": None,
            "transaction_id": None,
            "date": None,
            "time": None,
            "total_amount": None,
            "amount_paid": None,
            "payment_method": None,
            "bank_name": None,
            "confidence_score": 70
        }
        
        # Extract Bank Name
        bank_match = re.search(r'(STATE BANK OF INDIA|SBI|HDFC BANK|ICICI BANK|AXIS BANK)', text, re.IGNORECASE)
        if bank_match:
            data["merchant_name"] = bank_match.group(1)
            data["bank_name"] = bank_match.group(1)
        
        # Extract Date
        date_match = re.search(r'DATE:\s*(\d{2})-(\d{2})-(\d{4})', text)
        if date_match:
            data["date"] = f"{date_match.group(3)}-{date_match.group(2)}-{date_match.group(1)}"
        
        # Extract Time
        time_match = re.search(r'TIME:\s*(\d{2}:\d{2}:\d{2})', text)
        if time_match:
            data["time"] = time_match.group(1)
        
        # Extract Transaction ID
        ref_match = re.search(r'REFERENCE NO:\s*(\d+)', text)
        if ref_match:
            data["transaction_id"] = ref_match.group(1)
        
        # Extract Amount
        amount_match = re.search(r'AMOUNT DEPOSITED:\s*([\d\s,]+\.?\d*)', text)
        if amount_match:
            amount_str = amount_match.group(1).replace(' ', '').replace(',', '')
            try:
                data["total_amount"] = float(amount_str)
                data["amount_paid"] = float(amount_str)
            except:
                pass
        
        # Extract Transaction Type
        type_match = re.search(r'TRANSACTION TYPE:\s*(\w+)', text)
        if type_match:
            data["payment_method"] = type_match.group(1)
        
        # Extract Phone
        phone_match = re.search(r'call\s*(\d{4}\s*\d{4}\s*\d{4})', text)
        if phone_match:
            data["merchant_phone"] = phone_match.group(1).replace(' ', '')
        
        # Extract Address
        address_match = re.search(r'LOCATION:\s*([^,\n]+,[^,\n]+)', text)
        if address_match:
            data["merchant_address"] = address_match.group(1).strip()
        
        return json.dumps(data)

# ==================== MAIN ANALYZER CLASS ====================

class FinancialDocumentAnalyzer:
    """
    Multi-provider analyzer with priority:
    1. Instructor + Ollama (Qwen 2.5) - Guaranteed structured output
    2. OpenRouter - Cloud fallback
    3. Regex - Last resort
    """
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or OPENROUTER_API_KEY
        self.session = None
        self.providers = []
        
        # 1. PRIMARY: Instructor + Ollama (Best for structured extraction)
        if ENABLE_OLLAMA:
            self.providers.append(InstructorOllamaProvider())
            logger.info(f"Primary provider: Instructor + Ollama ({OLLAMA_MODEL})")
        
        # 2. SECONDARY: OpenRouter (Cloud backup)
        if ENABLE_OPENROUTER and self.api_key:
            self.providers.append(OpenRouterProvider(self.api_key))
            logger.info("Secondary provider: OpenRouter")
        
        # 3. TERTIARY: Regex (Always works)
        if ENABLE_REGEX_FALLBACK:
            self.providers.append(RegexProvider())
            logger.info("Fallback provider: Regex")
        
        if not self.providers:
            logger.warning("No providers configured!")
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def analyze_text(self, extracted_text: str) -> AIAnalysisResult:
        import time
        start_time = time.time()
        
        if not extracted_text or len(extracted_text.strip()) < 10:
            return AIAnalysisResult(
                success=False, extracted_data=None, raw_response="",
                processing_time=time.time() - start_time, provider="none",
                error="No text to analyze"
            )
        
        # Try each provider in priority order
        for provider in self.providers:
            logger.info(f"Trying: {provider.name}")
            
            try:
                # Different providers have different method signatures
                if provider.name == "instructor_ollama":
                    response, error = await provider.analyze(extracted_text)
                elif provider.name == "regex":
                    response, error = await provider.analyze(extracted_text)
                else:
                    # OpenRouter needs a prompt
                    prompt = self._create_fallback_prompt(extracted_text)
                    response, error = await provider.analyze(prompt, self.session)
                
                if response and not error:
                    # Parse the response
                    extracted_data = self._parse_response(response, extracted_text, provider.name)
                    
                    # Check if we got data
                    if extracted_data and (extracted_data.transaction_id or 
                                          extracted_data.total_amount or 
                                          extracted_data.merchant_name or
                                          extracted_data.date):
                        logger.info(f"SUCCESS with {provider.name}")
                        return AIAnalysisResult(
                            success=True,
                            extracted_data=extracted_data,
                            raw_response=response,
                            processing_time=time.time() - start_time,
                            provider=provider.name
                        )
                    else:
                        logger.warning(f"{provider.name} returned empty, trying next")
                else:
                    logger.warning(f"{provider.name} failed: {error}")
                    
            except Exception as e:
                logger.error(f"{provider.name} error: {e}")
                continue
        
        # All providers failed
        return AIAnalysisResult(
            success=False,
            extracted_data=None,
            raw_response="",
            processing_time=time.time() - start_time,
            provider="none",
            error="All providers failed"
        )
    
    def _create_fallback_prompt(self, extracted_text: str) -> str:
        """Fallback prompt for non-Instructor providers"""
        return f"""Extract from this receipt. Return ONLY valid JSON.

TEXT:
{extracted_text[:5000]}

Return: {{"document_type": "bank_receipt", "merchant_name": "", "transaction_id": "", "date": "", "time": "", "total_amount": 0, "payment_method": "", "bank_name": ""}}"""

    def _parse_response(self, response: str, raw_text: str, provider: str) -> FinancialData:
        """Parse response into FinancialData"""
        try:
            # Clean response
            cleaned = response.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            
            # If it's already a JSON string from Instructor, parse it
            data = json.loads(cleaned)
            
            result = FinancialData(
                document_type=data.get("document_type", "receipt"),
                raw_text=raw_text[:500],
                provider_used=provider
            )
            
            # Handle both nested and flat structures
            if "merchant" in data and isinstance(data["merchant"], dict):
                # Nested structure (from Instructor)
                result.merchant_name = data["merchant"].get("name")
                result.merchant_address = data["merchant"].get("address")
                result.merchant_phone = data["merchant"].get("phone")
            else:
                # Flat structure
                result.merchant_name = data.get("merchant_name")
                result.merchant_address = data.get("merchant_address")
                result.merchant_phone = data.get("merchant_phone")
            
            if "transaction" in data and isinstance(data["transaction"], dict):
                result.transaction_id = data["transaction"].get("id")
                result.date = data["transaction"].get("date")
                result.time = data["transaction"].get("time")
            else:
                result.transaction_id = data.get("transaction_id")
                result.date = data.get("date")
                result.time = data.get("time")
            
            if "financial" in data and isinstance(data["financial"], dict):
                result.total_amount = data["financial"].get("total")
                result.amount_paid = data["financial"].get("amount_paid")
            else:
                result.total_amount = data.get("total_amount")
                result.amount_paid = data.get("amount_paid")
            
            if "payment" in data and isinstance(data["payment"], dict):
                result.payment_method = data["payment"].get("method")
                result.bank_name = data["payment"].get("bank_name")
            else:
                result.payment_method = data.get("payment_method")
                result.bank_name = data.get("bank_name")
            
            if "hotel_details" in data and data["hotel_details"]:
                result.room_number = data["hotel_details"].get("room_number")
                result.guest_name = data["hotel_details"].get("guest_name")
            
            result.confidence_score = data.get("confidence_score", 70)
            
            return result
            
        except Exception as e:
            logger.error(f"Parse error: {e}")
            return FinancialData(raw_text=raw_text[:500], provider_used=provider, confidence_score=0)

# ==================== HELPER FUNCTIONS ====================

def format_financial_data_for_display(data: FinancialData) -> Dict:
    """Format FinancialData for JSON response"""
    if not data:
        return {}
    
    result = {
        "document_type": data.document_type,
        "merchant": {
            "name": data.merchant_name,
            "address": data.merchant_address,
            "phone": data.merchant_phone
        },
        "transaction": {
            "id": data.transaction_id,
            "date": data.date,
            "time": data.time
        },
        "financial": {
            "total": data.total_amount,
            "amount_paid": data.amount_paid,
            "currency": data.currency
        },
        "payment": {
            "method": data.payment_method,
            "bank_name": data.bank_name
        },
        "confidence_score": data.confidence_score,
        "provider_used": data.provider_used
    }
    
    # Add hotel details if present
    if data.room_number or data.guest_name:
        result["hotel_details"] = {
            "room_number": data.room_number,
            "guest_name": data.guest_name
        }
    
    return result