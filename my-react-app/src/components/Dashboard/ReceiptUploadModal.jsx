// src/components/Dashboard/ReceiptUploadModal.jsx

import React, { useState, useRef } from 'react';
import { 
  X, Upload, FileText, Loader2, CheckCircle, AlertCircle
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const ReceiptUploadModal = ({ isOpen, onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState('upload'); // upload, processing, result
  const fileInputRef = useRef(null);

  // Reset state when modal closes
  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError('');
    setStep('upload');
    setUploading(false);
    setProcessing(false);
    onClose();
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image (JPEG, PNG) or PDF file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setError('');

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  // Handle file upload and OCR
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setProcessing(true);
    setError('');
    setStep('processing');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }
      
      // Step 1: Extract text from image
      const extractResponse = await axios.post(
        `${API_BASE_URL}/ocr/extract`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('=== EXTRACT RESPONSE ===');
      console.log('Success:', extractResponse.data.success);
      console.log('Document ID:', extractResponse.data.documentId);
      console.log('Extracted text length:', extractResponse.data.extracted_text?.length);

      if (extractResponse.data.success && extractResponse.data.documentId) {
        const documentId = extractResponse.data.documentId;
        const extractedText = extractResponse.data.extracted_text || '';
        
        // Step 2: Process the extracted text
        const processResponse = await axios.post(
          `${API_BASE_URL}/ocr/process/${documentId}`,
          {},
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            } 
          }
        );

        console.log('=== PROCESS RESPONSE ===');
        console.log('Success:', processResponse.data.success);
        console.log('Summary:', processResponse.data.summary);
        console.log('Transactions Created:', processResponse.data.transactionsCreated);

        if (processResponse.data.success) {
          setResult({
            documentId,
            extractedText: extractedText,
            extractedAmount: processResponse.data.summary?.totalAmount,
            vendorName: processResponse.data.summary?.vendorName,
            transactionDate: processResponse.data.summary?.transactionDate,
            receiptType: processResponse.data.summary?.receiptType,
            transactionsCreated: processResponse.data.transactionsCreated || 0
          });
          setStep('result');
          if (onSuccess) onSuccess();
        } else {
          setError(processResponse.data.message || 'Failed to process receipt');
          setStep('upload');
        }
      } else {
        setError(extractResponse.data.message || 'Failed to extract text from receipt');
        setStep('upload');
      }
    } catch (err) {
      console.error('=== ERROR DETAILS ===');
      console.error('Status:', err.response?.status);
      console.error('Error:', err.response?.data);
      console.error('Message:', err.message);
      
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        setError(err.response?.data?.message || err.response?.data?.error || 'Failed to process receipt. Please try again.');
      }
      setStep('upload');
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) {
      const event = { target: { files: [file] } };
      handleFileSelect(event);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Upload Receipt</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {step === 'upload' && (
            <div>
              {/* Drag and drop area */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  selectedFile 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-300 hover:border-blue-400 bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {!selectedFile ? (
                  <div>
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload size={24} className="text-blue-600" />
                    </div>
                    <p className="text-gray-600 mb-2">Drag and drop your receipt here</p>
                    <p className="text-sm text-gray-400 mb-4">or</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Browse Files
                    </button>
                    <p className="text-xs text-gray-400 mt-4">
                      Supports: JPG, PNG, PDF (Max 5MB)
                    </p>
                  </div>
                ) : (
                  <div>
                    {preview ? (
                      <div className="mb-4">
                        <img 
                          src={preview} 
                          alt="Preview" 
                          className="max-h-48 mx-auto rounded-lg border"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText size={24} className="text-gray-600" />
                      </div>
                    )}
                    <p className="font-medium text-gray-900 mb-1">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500 mb-3">
                      {(selectedFile.size / 1024).toFixed(0)} KB
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setPreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Change File
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-center gap-2 text-red-600">
                  <AlertCircle size={16} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Upload button */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Upload & Process
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-12">
              <Loader2 size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Processing your receipt</h3>
              <p className="text-gray-500">Extracting text and creating transaction...</p>
            </div>
          )}

          {step === 'result' && result && (
            <div>
              {/* Success message */}
              <div className="bg-green-50 rounded-xl p-4 mb-6 flex items-center gap-3">
                <CheckCircle size={24} className="text-green-600" />
                <div>
                  <h3 className="font-medium text-green-800">Receipt processed successfully!</h3>
                  <p className="text-sm text-green-600">
                    {result.transactionsCreated} transaction(s) created
                  </p>
                </div>
              </div>

              {/* Extracted information */}
              <div className="space-y-4">
                <div className="border border-gray-100 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Extracted Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Vendor</p>
                      <p className="font-medium text-gray-900">{result.vendorName || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Amount</p>
                      <p className="font-medium text-gray-900">
                        {result.extractedAmount ? `₹${result.extractedAmount}` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Date</p>
                      <p className="font-medium text-gray-900">{result.transactionDate || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Type</p>
                      <p className="font-medium text-gray-900">{result.receiptType || 'GENERAL'}</p>
                    </div>
                  </div>
                </div>

                {/* Extracted text preview */}
                {result.extractedText && (
                  <div className="border border-gray-100 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Extracted Text</h4>
                    <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {result.extractedText}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                    setResult(null);
                    setStep('upload');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Upload Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptUploadModal;