import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface AgeVerificationProps {
  onVerify: (verified: boolean) => void;
}

export default function AgeVerification({ onVerify }: AgeVerificationProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = () => {
    // In a real app, you might want to collect birthdate
    localStorage.setItem('ageVerified', 'true');
    setIsVerified(true);
    onVerify(true);
  };

  const handleDeny = () => {
    setError('You must be of legal drinking age to access this site.');
  };

  return (
    <div className="fixed inset-0 bg-dark z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-surface rounded-3xl p-8 border border-white/10"
      >
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="text-gold" size={40} />
          </div>
          
          <div>
            <h1 className="text-3xl font-serif text-white mb-2">Age Verification</h1>
            <p className="text-white/60">
              You must be of legal drinking age to enter this site.
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 text-left space-y-2">
            <p className="text-white/80 text-sm">
              By entering, you confirm that you are:
            </p>
            <ul className="text-white/60 text-sm space-y-1">
              <li className="flex items-center">
                <CheckCircle size={14} className="mr-2 text-gold" />
                At least 18 years old (or local legal drinking age)
              </li>
              <li className="flex items-center">
                <CheckCircle size={14} className="mr-2 text-gold" />
                Legally allowed to purchase alcohol in your jurisdiction
              </li>
              <li className="flex items-center">
                <CheckCircle size={14} className="mr-2 text-gold" />
                Agree to drink responsibly
              </li>
            </ul>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <div className="space-y-3">
            <button
              onClick={handleVerify}
              className="w-full py-4 bg-gold text-dark font-bold uppercase tracking-widest rounded-xl hover:bg-gold/90 transition-colors"
            >
              Yes, I am of legal age
            </button>
            
            <button
              onClick={handleDeny}
              className="w-full py-4 bg-white/5 text-white/60 font-medium rounded-xl hover:bg-white/10 transition-colors"
            >
              No, I am not of legal age
            </button>
          </div>

          <p className="text-white/40 text-xs pt-4">
            Please drink responsibly. Alcohol abuse is harmful to health.
          </p>
        </div>
      </motion.div>
    </div>
  );
}