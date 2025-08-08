"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Coins } from "lucide-react";

interface RegradeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userContextNote?: string) => void;
  tokenBalance: number | null;
  isLoading?: boolean;
}

export function RegradeConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  tokenBalance,
  isLoading = false 
}: RegradeConfirmationModalProps) {
  const [userContextNote, setUserContextNote] = useState("");
  const hasEnoughTokens = (tokenBalance || 0) >= 1;

  const handleConfirm = () => {
    const note = userContextNote.trim() || undefined;
    onConfirm(note);
  };

  const handleClose = () => {
    setUserContextNote("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            Add context before regrading
          </DialogTitle>
          <DialogDescription className="text-foreground-muted">
            Provide additional context to help improve the analysis. This will cost 1 token.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="context-note" className="block text-sm font-medium text-foreground mb-2">
              Additional Context (Optional)
            </label>
            <Textarea
              id="context-note"
              value={userContextNote}
              onChange={(e) => setUserContextNote(e.target.value)}
              placeholder="Add any additional context, progress made, or new insights that should be considered in the updated analysis..."
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="text-xs text-foreground-muted mt-1">
              {userContextNote.length}/500 characters
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-surface rounded-lg">
            <Coins className="w-4 h-4 text-brand" />
            <span className="text-sm text-foreground-muted">
              Token balance: {tokenBalance || 0} tokens
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!hasEnoughTokens || isLoading}
            className="btn-primary"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-brand-foreground/30 border-t-brand-foreground rounded-full animate-spin mr-2" />
            ) : (
              <Coins className="w-4 h-4 mr-2" />
            )}
            Regrade Now (1 token)
          </Button>
        </DialogFooter>

        {!hasEnoughTokens && (
          <div className="text-sm text-red-600 text-center mt-2">
            Not enough tokens to regrade
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
