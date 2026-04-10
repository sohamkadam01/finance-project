"""
Production-Ready OCR Microservice for Finance Platform
Enhanced with Multiple OCR Engines, Image Preprocessing, and Robust Error Handling
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import easyocr
import cv2
import numpy as np
import uvicorn
import os
import tempfile
import logging
import asyncio
import hashlib
import json
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from PIL import Image, ImageEnhance, ImageFilter, UnidentifiedImageError
import io
import traceback
from contextlib import contextmanager
from concurrent.futures import ThreadPoolExecutor
import pytesseract
from pathlib import Path

# ------------------- CONFIG -------------------

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp", ".pdf"}
ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/bmp", "image/tiff", "image/webp", "application/pdf"]
MODEL_DIR = "./models"
CACHE_DIR = "./cache"
MAX_CACHE_SIZE = 100  # Max number of cached results
# TIMEOUT SESSION REMOVED - No timeout limit for OCR processing

# ------------------- CACHE SETUP -------------------

os.makedirs(CACHE_DIR, exist_ok=True)

# ------------------- LOGGING -------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# File handlers
file_handler = logging.FileHandler("ocr_service.log")
file_handler.setLevel(logging.INFO)
error_handler = logging.FileHandler("ocr_errors.log")
error_handler.setLevel(logging.ERROR)

formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
file_handler.setFormatter(formatter)
error_handler.setFormatter(formatter)

logger.addHandler(file_handler)
logger.addHandler(error_handler)

# ------------------- APP INIT -------------------

app = FastAPI(
    title="Finance OCR Service",
    description="Advanced OCR service for financial documents with multiple engines",
    version="3.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Thread pool for parallel processing
executor = ThreadPoolExecutor(max_workers=4)

# ------------------- MODEL INIT -------------------

os.makedirs(MODEL_DIR, exist_ok=True)

logger.info("Loading OCR models...")

# EasyOCR Reader
easyocr_reader = None
tesseract_available = False

try:
    easyocr_reader = easyocr.Reader(
        ['en'],
        model_storage_directory=MODEL_DIR,
        user_network_directory=os.path.join(MODEL_DIR, 'user_network'),
        gpu=False,
        download_enabled=True,
        recognizer='english_g2',
        detector='dbnet18'
    )
    logger.info("✅ EasyOCR model loaded successfully!")
except Exception as e:
    logger.error(f"❌ Failed to load EasyOCR: {str(e)}")

# Check Tesseract availability
try:
    pytesseract.get_tesseract_version()
    tesseract_available = True
    logger.info("✅ Tesseract OCR is available")
except Exception as e:
    logger.warning(f"⚠️ Tesseract not available: {str(e)}")

# ------------------- CACHE MANAGEMENT -------------------

def get_cache_key(content: bytes) -> str:
    """Generate cache key from file content"""
    return hashlib.md5(content).hexdigest()

def get_cached_result(cache_key: str) -> Optional[str]:
    """Retrieve cached OCR result"""
    cache_file = os.path.join(CACHE_DIR, f"{cache_key}.json")
    if os.path.exists(cache_file):
        try:
            with open(cache_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Check if cache is less than 30 days old
                cache_age = datetime.now() - datetime.fromisoformat(data['timestamp'])
                if cache_age.days < 30:
                    logger.info(f"Cache hit for key: {cache_key}")
                    return data['text']
        except Exception as e:
            logger.warning(f"Cache read failed: {str(e)}")
    return None

def cache_result(cache_key: str, text: str):
    """Cache OCR result"""
    cache_file = os.path.join(CACHE_DIR, f"{cache_key}.json")
    try:
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'text': text
            }, f)
        logger.info(f"Cached result for key: {cache_key}")
        
        # Clean old cache files
        cleanup_old_cache()
    except Exception as e:
        logger.warning(f"Cache write failed: {str(e)}")

def cleanup_old_cache():
    """Remove old cache files exceeding limit"""
    try:
        files = sorted(Path(CACHE_DIR).glob("*.json"), key=os.path.getmtime)
        while len(files) > MAX_CACHE_SIZE:
            files[0].unlink()
            files.pop(0)
    except Exception as e:
        logger.warning(f"Cache cleanup failed: {str(e)}")

# ------------------- IMAGE PREPROCESSING -------------------

def preprocess_image(image_bytes: bytes) -> List[np.ndarray]:
    """
    Apply multiple preprocessing techniques to improve OCR accuracy
    Returns list of processed images for multi-pass OCR
    """
    try:
        # Convert bytes to PIL Image
        pil_img = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if needed
        if pil_img.mode != 'RGB':
            pil_img = pil_img.convert('RGB')
        
        processed_images = []
        
        # 1. Original image
        img_original = np.array(pil_img)
        processed_images.append(('original', img_original))
        
        # 2. Grayscale
        img_gray = cv2.cvtColor(img_original, cv2.COLOR_RGB2GRAY)
        processed_images.append(('grayscale', img_gray))
        
        # 3. Binarization (thresholding)
        _, img_binary = cv2.threshold(img_gray, 127, 255, cv2.THRESH_BINARY)
        processed_images.append(('binary', img_binary))
        
        # 4. Adaptive thresholding
        img_adaptive = cv2.adaptiveThreshold(img_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                              cv2.THRESH_BINARY, 11, 2)
        processed_images.append(('adaptive', img_adaptive))
        
        # 5. Denoised
        img_denoised = cv2.fastNlMeansDenoising(img_gray, h=30)
        processed_images.append(('denoised', img_denoised))
        
        # 6. Sharpened
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        img_sharpened = cv2.filter2D(img_gray, -1, kernel)
        processed_images.append(('sharpened', img_sharpened))
        
        # 7. Contrast enhanced
        enhancer = ImageEnhance.Contrast(pil_img)
        img_contrast = np.array(enhancer.enhance(2.0))
        processed_images.append(('contrast', img_contrast))
        
        # 8. Resized (2x) for better recognition of small text
        height, width = img_gray.shape
        img_resized = cv2.resize(img_gray, (width*2, height*2), interpolation=cv2.INTER_CUBIC)
        processed_images.append(('resized', img_resized))
        
        return processed_images
        
    except Exception as e:
        logger.error(f"Image preprocessing failed: {str(e)}")
        return []

# ------------------- OCR ENGINE SELECTION -------------------

def ocr_with_easyocr(image: np.ndarray) -> str:
    """Run EasyOCR on image"""
    try:
        if easyocr_reader is None:
            return ""
        
        # Ensure image is in correct format
        if len(image.shape) == 2:
            # Grayscale to RGB
            image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
        elif image.shape[2] == 4:
            # RGBA to RGB
            image = cv2.cvtColor(image, cv2.COLOR_RGBA2RGB)
        
        result = easyocr_reader.readtext(image, detail=0, paragraph=True)
        return " ".join(result) if result else ""
    except Exception as e:
        logger.error(f"EasyOCR failed: {str(e)}")
        return ""

def ocr_with_tesseract(image: np.ndarray) -> str:
    """Run Tesseract OCR on image"""
    if not tesseract_available:
        return ""
    
    try:
        if len(image.shape) == 3:
            image = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # Tesseract configuration for better accuracy
        custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789₹.,/-: '
        text = pytesseract.image_to_string(image, config=custom_config)
        return text.strip()
    except Exception as e:
        logger.error(f"Tesseract failed: {str(e)}")
        return ""

def ocr_with_paddle(image: np.ndarray) -> str:
    """Placeholder for PaddleOCR (if installed)"""
    # PaddleOCR would go here
    return ""

# ------------------- MAIN OCR FUNCTION -------------------

def perform_multi_engine_ocr(image_bytes: bytes) -> Dict[str, str]:
    """
    Perform OCR using multiple engines and preprocessing techniques
    Returns best result from all attempts
    """
    results = {}
    
    try:
        # Preprocess image with multiple techniques
        processed_images = preprocess_image(image_bytes)
        
        if not processed_images:
            return {"text": "", "confidence": "LOW", "engine": "none"}
        
        # Try each preprocessing technique with each OCR engine
        for method_name, img in processed_images:
            # Try EasyOCR
            if easyocr_reader is not None:
                text = ocr_with_easyocr(img)
                if text and len(text) > len(results.get('text', '')):
                    results['text'] = text
                    results['confidence'] = 'HIGH' if len(text) > 50 else 'MEDIUM'
                    results['engine'] = f'easyocr_{method_name}'
                    results['method'] = method_name
            
            # Try Tesseract
            if tesseract_available:
                text = ocr_with_tesseract(img)
                if text and len(text) > len(results.get('text', '')):
                    results['text'] = text
                    results['confidence'] = 'HIGH' if len(text) > 50 else 'MEDIUM'
                    results['engine'] = f'tesseract_{method_name}'
                    results['method'] = method_name
        
        # Post-process extracted text
        if 'text' in results:
            results['text'] = post_process_text(results['text'])
            
    except Exception as e:
        logger.error(f"Multi-engine OCR failed: {str(e)}")
        results = {"text": "", "confidence": "LOW", "engine": "none", "error": str(e)}
    
    return results

def post_process_text(text: str) -> str:
    """Clean and normalize extracted text"""
    if not text:
        return ""
    
    # Remove excessive whitespace
    text = ' '.join(text.split())
    
    # Fix common OCR errors
    corrections = {
        '0': 'O',  # Only for certain contexts
        '1': 'I',
        '5': 'S',
    }
    
    # Normalize line endings
    text = text.replace('\\n', '\n')
    
    # Remove non-printable characters
    text = ''.join(char for char in text if char.isprintable() or char == '\n')
    
    return text.strip()

# ------------------- HELPER FUNCTIONS -------------------

@contextmanager
def timeout_context(seconds: int):
    """Context manager for timeout"""
    try:
        yield
    except TimeoutError:
        raise HTTPException(status_code=408, detail=f"Operation timed out after {seconds} seconds")

def validate_file_sync(filename: str, content: bytes) -> Dict:
    """Synchronous file validation"""
    errors = []
    
    if len(content) == 0:
        errors.append("File is empty")
    elif len(content) > MAX_FILE_SIZE:
        errors.append(f"File too large. Max size: {MAX_FILE_SIZE // 1024 // 1024}MB")
    
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        errors.append(f"Unsupported file extension: {ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")
    
    # Try to identify image using PIL
    try:
        with Image.open(io.BytesIO(content)) as img:
            if img.size[0] < 10 or img.size[1] < 10:
                errors.append(f"Image too small: {img.size[0]}x{img.size[1]} pixels")
            if img.size[0] > 10000 or img.size[1] > 10000:
                errors.append(f"Image dimensions too large: {img.size[0]}x{img.size[1]} pixels")
    except UnidentifiedImageError:
        errors.append("Cannot identify image format. File may be corrupted.")
    except Exception as e:
        errors.append(f"Image validation failed: {str(e)}")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "extension": ext,
        "size_bytes": len(content)
    }

# ------------------- HEALTH CHECK -------------------

@app.get("/")
async def root():
    return {
        "service": "Finance OCR Service",
        "status": "running",
        "version": "3.0.0",
        "engines": {
            "easyocr": easyocr_reader is not None,
            "tesseract": tesseract_available
        },
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy" if (easyocr_reader is not None or tesseract_available) else "degraded",
        "engines": {
            "easyocr": easyocr_reader is not None,
            "tesseract": tesseract_available
        },
        "service": "ocr-service",
        "timestamp": datetime.now().isoformat()
    }

# ------------------- MAIN OCR ENDPOINT -------------------

@app.post("/ocr/extract")
async def extract_text(file: UploadFile = File(...), background_tasks: BackgroundTasks = None) -> Dict:
    """
    Extract text from uploaded image file using multiple OCR engines
    """
    request_id = hashlib.md5(f"{file.filename}{datetime.now().isoformat()}".encode()).hexdigest()[:8]
    logger.info(f"[{request_id}] 📄 Received file: {file.filename}")
    
    # Check if at least one OCR engine is available
    if easyocr_reader is None and not tesseract_available:
        raise HTTPException(
            status_code=503,
            detail="No OCR engine available. Service unavailable."
        )
    
    # Read file content
    try:
        content = await file.read()
    except Exception as e:
        logger.error(f"[{request_id}] Failed to read file: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")
    
    # Check cache
    cache_key = get_cache_key(content)
    cached_result = get_cached_result(cache_key)
    if cached_result:
        logger.info(f"[{request_id}] Returning cached result")
        return {
            "success": True,
            "request_id": request_id,
            "filename": file.filename,
            "extracted_text": cached_result,
            "text_length": len(cached_result),
            "word_count": len(cached_result.split()),
            "cached": True,
            "timestamp": datetime.now().isoformat()
        }
    
    # Validate file
    validation = validate_file_sync(file.filename, content)
    if not validation["valid"]:
        logger.warning(f"[{request_id}] File validation failed: {validation['errors']}")
        raise HTTPException(
            status_code=400,
            detail=f"File validation failed: {'; '.join(validation['errors'])}"
        )
    
    logger.info(f"[{request_id}] ✅ File validated: {validation['size_bytes']} bytes, type: {validation['extension']}")
    
    # Process OCR without timeout - allowing unlimited time for text extraction
    try:
        # Run OCR in thread pool without any timeout restriction
        loop = asyncio.get_event_loop()
        ocr_result = await loop.run_in_executor(executor, perform_multi_engine_ocr, content)
        
        extracted_text = ocr_result.get('text', '')
        confidence = ocr_result.get('confidence', 'LOW')
        engine_used = ocr_result.get('engine', 'unknown')
        
        if not extracted_text:
            logger.warning(f"[{request_id}] No text extracted from image")
            return {
                "success": True,
                "request_id": request_id,
                "filename": file.filename,
                "extracted_text": "",
                "text_length": 0,
                "word_count": 0,
                "confidence": "LOW",
                "engine_used": engine_used,
                "warning": "No text detected in the image. Try a clearer image.",
                "timestamp": datetime.now().isoformat()
            }
        
        # Cache result
        background_tasks.add_task(cache_result, cache_key, extracted_text)
        
        logger.info(f"[{request_id}] ✅ OCR successful! Engine: {engine_used}, Confidence: {confidence}, Length: {len(extracted_text)}")
        
        return {
            "success": True,
            "request_id": request_id,
            "filename": file.filename,
            "extracted_text": extracted_text,
            "text_length": len(extracted_text),
            "word_count": len(extracted_text.split()),
            "confidence": confidence,
            "engine_used": engine_used,
            "file_size_bytes": validation["size_bytes"],
            "cached": False,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"[{request_id}] OCR processing failed: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

# ------------------- BATCH OCR ENDPOINT -------------------

@app.post("/ocr/extract-batch")
async def extract_batch(files: List[UploadFile] = File(...)) -> Dict:
    """
    Extract text from multiple images in parallel
    """
    logger.info(f"📚 Received batch request with {len(files)} files")
    
    results = []
    successful = 0
    failed = 0
    
    # Process files in parallel
    async def process_single_file(file: UploadFile, idx: int):
        try:
            content = await file.read()
            validation = validate_file_sync(file.filename, content)
            
            if not validation["valid"]:
                return {
                    "index": idx,
                    "filename": file.filename,
                    "success": False,
                    "error": "; ".join(validation["errors"])
                }
            
            # Run OCR without timeout for batch processing
            ocr_result = await asyncio.get_event_loop().run_in_executor(executor, perform_multi_engine_ocr, content)
            
            extracted_text = ocr_result.get('text', '')
            
            return {
                "index": idx,
                "filename": file.filename,
                "success": True,
                "text_length": len(extracted_text),
                "word_count": len(extracted_text.split()),
                "extracted_text": extracted_text,
                "confidence": ocr_result.get('confidence', 'LOW'),
                "engine_used": ocr_result.get('engine', 'unknown')
            }
            
        except Exception as e:
            return {
                "index": idx,
                "filename": file.filename,
                "success": False,
                "error": str(e)
            }
    
    # Run all files in parallel without timeout
    tasks = [process_single_file(file, idx) for idx, file in enumerate(files)]
    batch_results = await asyncio.gather(*tasks)
    
    # Sort by index and collect results
    batch_results.sort(key=lambda x: x['index'])
    for result in batch_results:
        results.append(result)
        if result['success']:
            successful += 1
        else:
            failed += 1
    
    return {
        "success": True,
        "total_files": len(files),
        "successful": successful,
        "failed": failed,
        "results": results,
        "timestamp": datetime.now().isoformat()
    }

# ------------------- STATS ENDPOINT -------------------

@app.get("/stats")
async def stats():
    """Get service statistics"""
    cache_files = list(Path(CACHE_DIR).glob("*.json"))
    return {
        "model": "Multi-Engine OCR",
        "languages": ["en"],
        "engines": {
            "easyocr": easyocr_reader is not None,
            "tesseract": tesseract_available
        },
        "gpu": False,
        "status": "active" if (easyocr_reader is not None or tesseract_available) else "inactive",
        "cache_size": len(cache_files),
        "max_file_size_mb": MAX_FILE_SIZE // 1024 // 1024,
        "allowed_formats": list(ALLOWED_EXTENSIONS),
        "timeout_enabled": False,  # Indicate that timeout has been removed
        "timestamp": datetime.now().isoformat()
    }

# ------------------- ERROR HANDLERS -------------------

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "status_code": exc.status_code,
            "timestamp": datetime.now().isoformat()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "An unexpected error occurred. Please try again.",
            "error_detail": str(exc) if os.getenv("DEBUG") == "true" else None,
            "timestamp": datetime.now().isoformat()
        }
    )

# ------------------- GRACEFUL SHUTDOWN -------------------

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down OCR service...")
    executor.shutdown(wait=True)
    logger.info("OCR service stopped")

# ------------------- ENTRY POINT -------------------

if __name__ == "__main__":
    print("=" * 70)
    print("🚀 Starting Finance OCR Service v3.0 (No Timeout Mode)")
    print("=" * 70)
    print(f"📁 Model Directory: {MODEL_DIR}")
    print(f"📄 Max File Size: {MAX_FILE_SIZE // 1024 // 1024}MB")
    print(f"🎨 Supported Formats: {', '.join(ALLOWED_EXTENSIONS)}")
    print(f"💾 Cache Directory: {CACHE_DIR}")
    print(f"⚙️  Max Cache Size: {MAX_CACHE_SIZE} files")
    print(f"⏰ Timeout: DISABLED (No time limit for OCR processing)")
    print("-" * 70)
    print("🧠 OCR Engines:")
    print(f"   • EasyOCR: {'✅ Available' if easyocr_reader else '❌ Not Available'}")
    print(f"   • Tesseract: {'✅ Available' if tesseract_available else '⚠️ Not Available (optional)'}")
    print("-" * 70)
    print("📚 API Documentation: http://localhost:8000/docs")
    print("🏥 Health Check: http://localhost:8000/health")
    print("📊 Stats: http://localhost:8000/stats")
    print("=" * 70)
    
    uvicorn.run(
        "ocr_service:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )