"use client";

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from "lucide-react";
import Reveal from "@/components/ui/Reveal";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  ideaText?: string;
  isLoading?: boolean;
}

export function DeleteConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  ideaText,
  isLoading = false 
}: DeleteConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Reveal>
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </Reveal>
            <Reveal delay={0.06}>
              <DialogTitle className="text-lg font-semibold text-foreground">
                Delete Idea
              </DialogTitle>
            </Reveal>
          </div>
          <Reveal delay={0.12}>
            <DialogDescription className="text-foreground-muted pt-2">
              Are you sure you want to delete this idea? This action cannot be undone.
            </DialogDescription>
          </Reveal>
        </DialogHeader>

        {ideaText && (
          <Reveal delay={0.18}>
            <div className="p-3 bg-surface rounded-lg border">
              <p className="text-sm text-foreground-muted mb-1">Idea to delete:</p>
              <p className="text-foreground text-sm line-clamp-2">{ideaText}</p>
            </div>
          </Reveal>
        )}

        <DialogFooter className="gap-3">
          <Reveal delay={0.24}>
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </Reveal>
          <Reveal delay={0.30}>
            <Button 
              variant="destructive" 
              onClick={onConfirm}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Idea
                </>
              )}
            </Button>
          </Reveal>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 