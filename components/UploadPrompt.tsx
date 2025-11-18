import React from 'react';
import { UploadIcon, ImportIcon } from './Icons';

interface UploadPromptProps {
  onFilesSelected: (files: FileList) => void;
  onImportSelected: (file: File) => void;
  isLoading: boolean;
}

const UploadPrompt: React.FC<UploadPromptProps> = ({ onFilesSelected, onImportSelected, isLoading }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onFilesSelected(event.target.files);
    }
  };

  const handleImportChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onImportSelected(event.target.files[0]);
    }
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl max-w-lg mx-auto bg-white dark:bg-gray-800">
        <UploadIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500" />
        <h2 className="mt-4 text-2xl font-bold text-gray-800 dark:text-gray-100">Create Your Photobook</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Upload your photos and let AI write the perfect captions for your memories.
        </p>
        <div className="mt-6">
          <label
            htmlFor="file-upload"
            className={`cursor-pointer inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Select Photos
          </label>
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            className="sr-only"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            disabled={isLoading}
          />
        </div>
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          or
        </div>
        <div className="mt-4">
            <label 
                htmlFor="import-photobook"
                className={`cursor-pointer inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <ImportIcon className="w-5 h-5 mr-2" />
                Import a saved Photobook
            </label>
            <input
                id="import-photobook"
                name="import-photobook"
                type="file"
                className="sr-only"
                accept=".html"
                onChange={handleImportChange}
                disabled={isLoading}
            />
        </div>
      </div>
    </div>
  );
};

export default UploadPrompt;