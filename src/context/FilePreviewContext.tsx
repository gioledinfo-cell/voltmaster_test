import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PreviewableFile } from '../types/preview';

interface SignedUrlResponse {
  url: string;
  expiresAt: string;
}

interface FilePreviewContextType {
  activeFile: PreviewableFile | null;
  fileList: PreviewableFile[];
  currentIndex: number;
  totalFiles: number;
  isOpen: boolean;
  hasNext: boolean;
  hasPrev: boolean;
  openPreview: (file: PreviewableFile, list?: PreviewableFile[]) => void;
  addAndOpenFiles: (newFiles: PreviewableFile[]) => void;
  closePreview: () => void;
  nextFile: () => void;
  prevFile: () => void;
  getSignedPreviewUrl: (file: PreviewableFile) => Promise<SignedUrlResponse>;
}

const FilePreviewContext = createContext<FilePreviewContextType | undefined>(undefined);

export const FilePreviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeFile, setActiveFile] = useState<PreviewableFile | null>(null);
  const [fileList, setFileList] = useState<PreviewableFile[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Cache temporanea per non ricaricare URL firmati già richiesti
  const [signedCache, setSignedCache] = useState<Record<string, SignedUrlResponse>>({});

  const currentIndex = activeFile
    ? fileList.findIndex((f) => f.id === activeFile.id)
    : -1;
  const totalFiles = fileList.length;
  const hasNext = currentIndex >= 0 && currentIndex < totalFiles - 1;
  const hasPrev = currentIndex > 0;

  // Simulatore API: GET /api/files/:id/preview-url
  const getSignedPreviewUrl = useCallback(
    async (file: PreviewableFile): Promise<SignedUrlResponse> => {
      // Se già in cache e non scaduto (scadenza simulata a 15 minuti)
      const cached = signedCache[file.id];
      if (cached && new Date(cached.expiresAt).getTime() > Date.now()) {
        return cached;
      }

      // Simulazione chiamata backend con URL sicuro temporaneo
      const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const signed: SignedUrlResponse = {
        url: file.url,
        expiresAt: expires,
      };

      setSignedCache((prev) => ({ ...prev, [file.id]: signed }));
      return signed;
    },
    [signedCache]
  );

  const openPreview = useCallback((file: PreviewableFile, list?: PreviewableFile[]) => {
    setActiveFile(file);
    if (list && list.length > 0) {
      setFileList(list);
    } else {
      setFileList([file]);
    }
    setIsOpen(true);
  }, []);

  const addAndOpenFiles = useCallback((newFiles: PreviewableFile[]) => {
    if (newFiles.length === 0) return;
    setFileList((prev) => {
      const existingIds = new Set(prev.map((f) => f.id));
      const added = newFiles.filter((f) => !existingIds.has(f.id));
      return [...added, ...prev];
    });
    setActiveFile(newFiles[0]);
    setIsOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    setIsOpen(false);
    setActiveFile(null);
  }, []);

  const nextFile = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < fileList.length - 1) {
      setActiveFile(fileList[currentIndex + 1]);
    }
  }, [currentIndex, fileList]);

  const prevFile = useCallback(() => {
    if (currentIndex > 0) {
      setActiveFile(fileList[currentIndex - 1]);
    }
  }, [currentIndex, fileList]);

  // Supporto tastiera globale: ESC per chiudere, Frecce ← → per navigare
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        closePreview();
      } else if (e.key === 'ArrowRight') {
        nextFile();
      } else if (e.key === 'ArrowLeft') {
        prevFile();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closePreview, nextFile, prevFile]);

  return (
    <FilePreviewContext.Provider
      value={{
        activeFile,
        fileList,
        currentIndex,
        totalFiles,
        isOpen,
        hasNext,
        hasPrev,
        openPreview,
        addAndOpenFiles,
        closePreview,
        nextFile,
        prevFile,
        getSignedPreviewUrl,
      }}
    >
      {children}
    </FilePreviewContext.Provider>
  );
};

export const useFilePreview = () => {
  const context = useContext(FilePreviewContext);
  if (!context) {
    throw new Error('useFilePreview deve essere utilizzato all’interno di FilePreviewProvider');
  }
  return context;
};
