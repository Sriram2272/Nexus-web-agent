import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const navigate = useNavigate();

  const handleSignIn = () => {
    onClose();
    navigate('/auth');
  };

  const handleSignUp = () => {
    onClose();
    navigate('/signup');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            Please sign in to continue
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-4">
          <p className="text-center text-muted-foreground">
            You need to be signed in to search across multiple sites.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={handleSignIn} className="w-full">
              Sign In
            </Button>
            <Button onClick={handleSignUp} variant="outline" className="w-full">
              Sign Up
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;