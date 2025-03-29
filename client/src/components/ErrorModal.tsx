import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle } from "lucide-react";

interface ErrorModalProps {
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ error, onClose, onRetry }) => {
  const isOpen = !!error;

  return (
    <AlertDialog open={isOpen} onOpenChange={() => isOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center text-error gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>Error</span>
          </AlertDialogTitle>
          <AlertDialogDescription>
            {error}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onRetry}>
            Try Again
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ErrorModal;
