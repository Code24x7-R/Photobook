
export interface Photo {
  id: string;
  src: string;
  file: File;
  title: string;
  caption: string;
  album: string;
  tags: string[];
  isLoading: boolean;
  error?: string;
}