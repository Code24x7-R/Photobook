import React, { useState, useRef, useEffect } from 'react';
import type { Photo } from '../types';
import { SpinnerIcon, ErrorIcon, EditIcon, TagIcon, CloseIcon, DeleteIcon } from './Icons';

interface PhotoCardProps {
  photo: Photo;
  onCaptionChange: (id: string, newCaption: string) => void;
  onTitleChange: (id: string, newTitle: string) => void;
  onTagsChange: (id: string, newTags: string[]) => void;
  onDelete: (id: string) => void;
}

const TitleLoader: React.FC = () => (
    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2 animate-pulse"></div>
);

const CaptionLoader: React.FC = () => (
    <div className="space-y-2 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
    </div>
);

const useAutosizeTextArea = (
  textAreaRef: React.RefObject<HTMLTextAreaElement>,
  value: string
) => {
  useEffect(() => {
    const textArea = textAreaRef.current;
    if (textArea) {
      // Reset height to allow both growing and shrinking.
      textArea.style.height = 'auto';
      const scrollHeight = textArea.scrollHeight;
      textArea.style.height = scrollHeight + 'px';
    }
  }, [textAreaRef, value]);
};


const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onCaptionChange, onTitleChange, onTagsChange, onDelete }) => {
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [editedCaption, setEditedCaption] = useState(photo.caption);
  const captionTextAreaRef = useRef<HTMLTextAreaElement>(null);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(photo.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [tagInput, setTagInput] = useState('');

  useAutosizeTextArea(captionTextAreaRef, editedCaption);

  useEffect(() => {
    if (!isEditingCaption) {
        setEditedCaption(photo.caption);
    }
  }, [photo.caption, isEditingCaption]);
  
  useEffect(() => {
    if (!isEditingTitle) {
        setEditedTitle(photo.title);
    }
  }, [photo.title, isEditingTitle]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
        titleInputRef.current.focus();
        titleInputRef.current.select();
    }
  }, [isEditingTitle]);
  
  useEffect(() => {
    if (isEditingCaption && captionTextAreaRef.current) {
        captionTextAreaRef.current.focus();
        // Move cursor to end of text
        const len = captionTextAreaRef.current.value.length;
        captionTextAreaRef.current.setSelectionRange(len, len);
    }
  }, [isEditingCaption]);


  const handleSaveCaption = () => {
    if (editedCaption.trim() !== photo.caption) {
        onCaptionChange(photo.id, editedCaption.trim());
    }
    setIsEditingCaption(false);
  };
  
  const handleCancelCaption = () => {
    setEditedCaption(photo.caption);
    setIsEditingCaption(false);
  };
  
  const handleCaptionKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
        event.preventDefault();
        handleCancelCaption();
    }
    // Ctrl+Enter or Cmd+Enter to save
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        handleSaveCaption();
    }
  };

  const handleSaveTitle = () => {
    if (editedTitle.trim() && editedTitle.trim() !== photo.title) {
        onTitleChange(photo.id, editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleCancelTitle = () => {
    setEditedTitle(photo.title);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        handleSaveTitle();
    }
    if (event.key === 'Escape') {
        event.preventDefault();
        handleCancelTitle();
    }
  };

  const handleAddTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !photo.tags.includes(newTag)) {
        onTagsChange(photo.id, [...photo.tags, newTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(photo.id, photo.tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleTagInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        handleAddTag();
    }
  };

  const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation(); // Prevents other click handlers on the card from firing
    onDelete(photo.id);
  };

  const renderTitle = () => {
    if (isEditingTitle) {
        return (
            <div>
                <input
                    ref={titleInputRef}
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={handleTitleKeyDown}
                    className="text-xl font-bold font-serif text-gray-800 dark:text-gray-100 w-full border-0 focus:ring-2 focus:ring-indigo-500 p-0 bg-transparent outline-none rounded"
                    placeholder="Add a title..."
                />
                 <div className="flex justify-end items-center mt-2 space-x-2">
                    <button
                        onClick={handleCancelTitle}
                        className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveTitle}
                        className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Save
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="relative group cursor-pointer rounded" onClick={() => !isEditingCaption && setIsEditingTitle(true)}>
            <h3 className="text-xl font-bold font-serif text-gray-800 dark:text-gray-100 truncate">{photo.title || "Click to add a title..."}</h3>
            <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 rounded-full">
                <EditIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </div>
        </div>
    )
  }
  
  const renderTags = () => {
    return (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center mb-2">
                <TagIcon className="w-5 h-5 text-gray-400 mr-2" />
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Tags</h4>
            </div>
            <div className="flex flex-wrap gap-2">
                {photo.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 text-xs font-medium px-2.5 py-1 rounded-full">
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="ml-1.5 text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-200">
                            <CloseIcon className="w-3 h-3" />
                        </button>
                    </span>
                ))}
            </div>
             <div className="mt-2">
                <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    onBlur={handleAddTag}
                    placeholder="Add a tag..."
                    className="text-sm w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
            </div>
        </div>
    )
  }

  const renderCaption = () => {
    if (isEditingCaption) {
      return (
        <div className="flex flex-col">
            <textarea
              ref={captionTextAreaRef}
              value={editedCaption}
              onChange={(e) => setEditedCaption(e.target.value)}
              onKeyDown={handleCaptionKeyDown}
              className="text-gray-700 dark:text-gray-300 font-serif text-base leading-relaxed w-full resize-none border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-md outline-none"
              placeholder="Add a caption..."
            />
            <div className="flex justify-end items-center mt-2 space-x-2">
                <button
                    onClick={handleCancelCaption}
                    className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSaveCaption}
                    className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Save
                </button>
            </div>
        </div>
      );
    }
  
    const captionText = photo.caption || "Click to add a caption...";
    const isPlaceholder = !photo.caption;
  
    return (
      <div className="relative group cursor-pointer rounded" onClick={() => !isEditingTitle && setIsEditingCaption(true)}>
        <p className={`text-gray-700 dark:text-gray-300 font-serif text-base leading-relaxed whitespace-pre-wrap ${isPlaceholder ? 'italic text-gray-400 dark:text-gray-500' : ''}`}>
          {captionText}
        </p>
        <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 rounded-full">
          <EditIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </div>
      </div>
    );
  };
  
  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md transform hover:shadow-xl transition-shadow duration-300 group flex flex-col">
      <button
        onClick={handleDeleteClick}
        className="absolute top-2 right-2 z-10 p-1.5 bg-black bg-opacity-40 rounded-full text-white hover:bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none"
        aria-label="Delete photo"
      >
        <DeleteIcon className="w-5 h-5" />
      </button>
      <div className="p-4 md:p-6 pb-0 flex-shrink-0">
        {photo.isLoading ? (
            <TitleLoader />
        ) : photo.error ? (
            null // Error shown in caption area
        ) : (
            renderTitle()
        )}
      </div>
      <div className="relative aspect-square w-full mt-2">
         <img src={photo.src} alt={photo.title || "User upload"} className="w-full h-full object-cover" />
         {photo.isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <SpinnerIcon className="w-10 h-10 text-white animate-spin" />
            </div>
         )}
      </div>
      <div className="p-4 md:p-6 flex flex-col flex-grow">
        {photo.isLoading ? (
          <CaptionLoader />
        ) : photo.error ? (
          <div className="flex items-center space-x-2 text-red-500">
            <ErrorIcon className="w-6 h-6 flex-shrink-0" />
            <p className="text-sm font-medium">{photo.error}</p>
          </div>
        ) : (
          <div className="flex flex-col flex-grow">
            <div className="flex-grow">
              {renderCaption()}
            </div>
            {/* Tags disappear if either title or caption is being edited to reduce clutter */}
            {!isEditingCaption && !isEditingTitle && (
                <div className="mt-auto">
                    {renderTags()}
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoCard;
