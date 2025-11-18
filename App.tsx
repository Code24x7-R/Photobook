import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { Photo } from './types';
import { generatePhotoDetails } from './services/geminiService';
import { savePhotobook, importPhotobook } from './services/photobookGenerator';
import UploadPrompt from './components/UploadPrompt';
import PhotoCard from './components/PhotoCard';
import ConfirmationModal from './components/ConfirmationModal';
import { useTheme } from './hooks/useTheme';
import { UploadIcon, ShareIcon, SpinnerIcon, ImportIcon, FolderIcon, EditIcon, SunIcon, MoonIcon, NewPhotobookIcon } from './components/Icons';

const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);
  const [isNewPhotobookModalOpen, setIsNewPhotobookModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<{ oldName: string; newName: string; } | null>(null);
  const [processingProgress, setProcessingProgress] = useState({ completed: 0, total: 0 });
  const albumTitleInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingAlbum && albumTitleInputRef.current) {
      albumTitleInputRef.current.focus();
      albumTitleInputRef.current.select();
    }
  }, [editingAlbum]);

  useEffect(() => {
    if (processingProgress.total > 0 && processingProgress.completed >= processingProgress.total) {
      const timer = setTimeout(() => {
          setProcessingProgress({ completed: 0, total: 0 });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [processingProgress]);

  const processPhotoContent = useCallback(async (newPhoto: Photo) => {
    try {
      const { title, caption, album, tags } = await generatePhotoDetails(newPhoto.file);
      setPhotos(prevPhotos =>
        prevPhotos.map(p =>
          p.id === newPhoto.id ? { ...p, title, caption, album, tags, isLoading: false } : p
        )
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setPhotos(prevPhotos =>
        prevPhotos.map(p =>
          p.id === newPhoto.id ? { ...p, album: 'Uncategorized', tags: [], error: errorMessage, isLoading: false } : p
        )
      );
    } finally {
        setProcessingProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
    }
  }, []);

  const handleFilesSelected = useCallback((files: FileList) => {
    const newPhotos: Photo[] = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      src: URL.createObjectURL(file),
      file,
      title: '',
      caption: '',
      album: '',
      tags: [],
      isLoading: true,
    }));
    
    setProcessingProgress(prev => ({
        completed: prev.completed,
        total: prev.total + newPhotos.length
    }));
    setPhotos(prevPhotos => [...prevPhotos, ...newPhotos]);

    newPhotos.forEach(photo => {
      processPhotoContent(photo);
    });
  }, [processPhotoContent]);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      handleFilesSelected(event.target.files);
      event.target.value = ''; // Reset input to allow re-uploading the same file
    }
  };
  
  const handleImportSelected = useCallback(async (file: File) => {
    setIsImporting(true);
    try {
        const imported = await importPhotobook(file);
        if (imported.length > 0) {
            setPhotos(prevPhotos => [...prevPhotos, ...imported]);
        } else {
            alert("No photos were found in the selected photobook file.");
        }
    } catch (error) {
        console.error("Failed to import photobook:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        alert(`An error occurred while importing your photobook: ${errorMessage}`);
    } finally {
        setIsImporting(false);
    }
  }, []);

  const handleImportInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      handleImportSelected(event.target.files[0]);
      event.target.value = ''; // Reset input
    }
  };


  const handleSave = async () => {
    setIsSaving(true);
    try {
      await savePhotobook(photos);
    } catch (error) {
      console.error("Failed to save photobook:", error);
      alert("An error occurred while saving your photobook. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleTitleChange = (photoId: string, newTitle: string) => {
    setPhotos(prevPhotos =>
      prevPhotos.map(p =>
        p.id === photoId ? { ...p, title: newTitle } : p
      )
    );
  };

  const handleCaptionChange = (photoId: string, newCaption: string) => {
    setPhotos(prevPhotos =>
      prevPhotos.map(p =>
        p.id === photoId ? { ...p, caption: newCaption } : p
      )
    );
  };

  const handleTagsChange = (photoId: string, newTags: string[]) => {
    setPhotos(prevPhotos =>
        prevPhotos.map(p =>
            p.id === photoId ? { ...p, tags: newTags } : p
        )
    );
  };

  const handleDeletePhoto = (photoId: string) => {
    setPhotoToDelete(photoId);
  };

  const confirmDelete = () => {
    if (!photoToDelete) return;
    setPhotos(prevPhotos => prevPhotos.filter(p => p.id !== photoToDelete));
    setPhotoToDelete(null);
  };

  const cancelDelete = () => {
    setPhotoToDelete(null);
  };

  const handleAlbumNameChange = (oldName: string, newName: string) => {
    const trimmedNewName = newName.trim();
    if (!trimmedNewName) {
        setEditingAlbum(null);
        return;
    };

    setPhotos(prevPhotos =>
        prevPhotos.map(p => 
            p.album === oldName ? { ...p, album: trimmedNewName } : p
        )
    );
    setEditingAlbum(null);
  };
  
  const handleSaveAlbumName = () => {
    if (editingAlbum) {
        handleAlbumNameChange(editingAlbum.oldName, editingAlbum.newName);
    }
  };

  const handleAlbumKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
        handleSaveAlbumName();
    }
    if (event.key === 'Escape') {
        setEditingAlbum(null);
    }
  };

  const handleNewPhotobook = () => {
    setIsNewPhotobookModalOpen(true);
  };

  const confirmNewPhotobook = () => {
    setPhotos([]);
    setIsNewPhotobookModalOpen(false);
  };

  const cancelNewPhotobook = () => {
    setIsNewPhotobookModalOpen(false);
  };


  const isLoading = isSaving || isImporting;
  const isProcessing = processingProgress.total > 0;

  const albums = useMemo(() => {
    const grouped: Record<string, Photo[]> = {};
    photos.forEach(photo => {
        const albumName = photo.album || (photo.isLoading ? '...' : 'Uncategorized');
        if (!grouped[albumName]) {
            grouped[albumName] = [];
        }
        grouped[albumName].push(photo);
    });
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [photos]);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans">
      <header className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
             {isProcessing ? (
                <div className="flex items-center">
                    <SpinnerIcon className="w-6 h-6 text-indigo-600 animate-spin mr-3" />
                    <span className="text-md text-gray-600 dark:text-gray-300">
                        Generating details... ({processingProgress.completed}/{processingProgress.total})
                    </span>
                </div>
            ) : (
              <>
                <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/><path d="M12.5 7H11V13H16V11.5H12.5V7Z" fill="currentColor"/><path d="M9 16.9999C8.72 16.9999 8.5 17.2199 8.5 17.4999C8.5 17.7799 8.72 17.9999 9 17.9999H15C15.28 17.9999 15.5 17.7799 15.5 17.4999C15.5 17.2199 15.28 16.9999 15 16.9999H9Z" fill="currentColor"/></svg>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 ml-2">
                  AI Photobook Captioner
                </h1>
              </>
            )}
          </div>
          <div className="flex items-center">
            {photos.length > 0 && (
              <div className="flex items-center space-x-2 sm:space-x-4">
                  <button
                      onClick={handleNewPhotobook}
                      disabled={isLoading}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-500 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <NewPhotobookIcon className="w-5 h-5 mr-2" />
                      New
                  </button>
                  <button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors disabled:bg-teal-400 disabled:cursor-not-allowed"
                  >
                      {isSaving ? (
                          <>
                              <SpinnerIcon className="w-5 h-5 mr-2 animate-spin" />
                              Saving...
                          </>
                      ) : (
                          <>
                              <ShareIcon className="w-5 h-5 mr-2" />
                              Save & Share
                          </>
                      )}
                  </button>
                  <label htmlFor="add-more-photos" className={`cursor-pointer inline-flex items-center px-4 py-2 border border-indigo-600 text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <UploadIcon className="w-5 h-5 mr-2" />
                      Add More
                  </label>
                  <label 
                      htmlFor="import-photobook-header" 
                      className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                      {isImporting ? (
                          <>
                              <SpinnerIcon className="w-5 h-5 mr-2 animate-spin" />
                              Importing...
                          </>
                      ) : (
                          <>
                              <ImportIcon className="w-5 h-5 mr-2" />
                              Import
                          </>
                      )}
                  </label>
              </div>
            )}
            <button
              onClick={toggleTheme}
              className="ml-4 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-white dark:focus:ring-offset-gray-800"
              aria-label="Toggle dark mode"
            >
              {theme === 'light' ? (
                <MoonIcon className="w-6 h-6" />
              ) : (
                <SunIcon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {photos.length === 0 ? (
          <div style={{height: 'calc(100vh - 120px)'}} className="flex items-center justify-center">
            <UploadPrompt onFilesSelected={handleFilesSelected} onImportSelected={handleImportSelected} isLoading={isLoading} />
          </div>
        ) : (
          <div className="space-y-12">
            {albums.map(([albumName, albumPhotos]) => (
              <section key={albumName}>
                {editingAlbum?.oldName === albumName ? (
                    <div className="flex items-center mb-6">
                        <FolderIcon className="w-8 h-8 text-indigo-500 mr-3 flex-shrink-0" />
                        <input
                            ref={albumTitleInputRef}
                            type="text"
                            value={editingAlbum.newName}
                            onChange={(e) => setEditingAlbum({ ...editingAlbum, newName: e.target.value })}
                            onBlur={handleSaveAlbumName}
                            onKeyDown={handleAlbumKeyDown}
                            className="text-3xl font-bold font-serif text-gray-900 dark:text-gray-100 border-b-2 border-indigo-500 focus:outline-none bg-transparent w-full"
                        />
                    </div>
                ) : (
                <div 
                    className="flex items-center mb-6 group cursor-pointer"
                    onClick={() => setEditingAlbum({ oldName: albumName, newName: albumName })}
                >
                  <FolderIcon className="w-8 h-8 text-indigo-500 mr-3" />
                  <h2 className="text-3xl font-bold font-serif text-gray-900 dark:text-gray-100">{albumName}</h2>
                  <EditIcon className="w-6 h-6 text-gray-500 dark:text-gray-400 ml-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                  {albumPhotos.map(photo => (
                    <PhotoCard 
                      key={photo.id} 
                      photo={photo} 
                      onCaptionChange={handleCaptionChange}
                      onTitleChange={handleTitleChange}
                      onTagsChange={handleTagsChange}
                      onDelete={handleDeletePhoto}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <input
        type="file"
        id="add-more-photos"
        className="sr-only"
        multiple
        accept="image/*"
        onChange={handleFileInputChange}
        disabled={isLoading}
      />
       <input
        type="file"
        id="import-photobook-header"
        className="sr-only"
        accept=".html"
        onChange={handleImportInputChange}
        disabled={isLoading}
      />
      <ConfirmationModal
        isOpen={!!photoToDelete}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Photo"
        message="Are you sure you want to delete this photo and all its details? This action cannot be undone."
      />
      <ConfirmationModal
        isOpen={isNewPhotobookModalOpen}
        onClose={cancelNewPhotobook}
        onConfirm={confirmNewPhotobook}
        title="Create New Photobook"
        message="Are you sure you want to start a new photobook? All current photos and their details will be cleared."
        confirmButtonText="Create New"
      />
    </div>
  );
};

export default App;