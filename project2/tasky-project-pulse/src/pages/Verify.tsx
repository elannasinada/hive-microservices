import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { authAPI } from '@/utils/api';
import { CheckCircle2, XCircle } from 'lucide-react';

const Verify = () => {
  const { token } = useParams();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const verifyAccount = async () => {
      if (!token) {
        setVerificationStatus('error');
        return;
      }

      try {
        // First try GET request
        await authAPI.getAccountVerification(token);
        setVerificationStatus('success');
      } catch (error) {
        try {
          // If GET fails, try POST request
          await authAPI.postAccountVerification(token);
          setVerificationStatus('success');
        } catch (error) {
          console.error('Account verification failed:', error);
          setVerificationStatus('error');
        }
      }
    };

    verifyAccount();
  }, [token]);

  if (verificationStatus === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary/70">Verifying your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-accent/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
            {verificationStatus === 'success' ? (
              <>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
                Account Verified
              </>
            ) : (
              <>
                <XCircle className="w-8 h-8 text-red-500" />
                Verification Failed
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-secondary/70 mb-6">
            {verificationStatus === 'success'
              ? 'Your account has been successfully activated! You may now log in.'
              : 'Invalid or expired verification link.'}
          </p>
          <Button asChild className="bg-primary hover:bg-secondary text-white">
            <Link to="/login">Go to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Verify;