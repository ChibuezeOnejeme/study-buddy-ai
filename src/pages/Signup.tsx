import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
 import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Signup = () => {
   const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);

    const { error } = await signUp(email, password, fullName);
    
    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
       toast.success(t('auth.checkEmail'));
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-display text-xl font-bold">Learnorita</span>
          </Link>

           <h1 className="font-display text-3xl font-bold mb-2">{t('auth.createAccount')}</h1>
          <p className="text-muted-foreground mb-8">
             {t('auth.startJourney')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
               <Label htmlFor="fullName">{t('auth.fullName')}</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
               <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
               <Label htmlFor="password">{t('auth.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
               <p className="text-xs text-muted-foreground">{t('auth.passwordMinLength')}</p>
            </div>

            <Button type="submit" variant="hero" className="w-full" disabled={loading}>
               {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('auth.create')}
            </Button>
          </form>

          <p className="text-center text-muted-foreground mt-6">
             {t('auth.haveAccount')}{' '}
            <Link to="/login" className="text-accent hover:underline font-medium">
               {t('nav.signIn')}
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-hero items-center justify-center p-12">
        <div className="max-w-md text-center text-primary-foreground">
          <h2 className="font-display text-4xl font-bold mb-4">
             {t('auth.joinLearners')}
          </h2>
          <p className="text-primary-foreground/80 text-lg">
             {t('auth.uploadMaterials')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
