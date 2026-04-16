import React, { useState } from 'react';
import { TextField, Button, InputAdornment, IconButton, CircularProgress } from '@mui/material';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';
import { useNavigate, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/auth-context';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Si ya está logueado, evitar que vea el login
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorText("");

    const result = await login(username, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setErrorText(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f0f0] px-4">
      {/* Contenedor Principal */}
      <div className="flex flex-col lg:flex-row w-full max-w-[1000px] h-auto lg:h-[600px] bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100">

        {/* Lado Izquierdo - Branding Sobrio */}
        <div className="hidden lg:flex w-1/2 bg-[#fafafa] flex-col items-center justify-center p-12 relative border-r border-gray-100">
          {/* Patrón de puntos geométrico para emular el estilo del logo */}
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-60"></div>

          <div className="z-10 flex flex-col items-center">
            {/* Espacio para la imagen real del logo */}
            {/* Reemplazá el \`src\` con el path a tu logo original adentro de \`/public\` o importado */}
            <div className="w-64 h-64 bg-transparent flex items-center justify-center mb-6">
              <img src="/logo-fichar.png" alt="FichAR Logo" className="object-contain w-full h-full opacity-90"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              {/* Fallback geométrico puro usando SVG en caso de no encontrar la imagen */}
              <div style={{ display: 'none' }} className="w-40 h-40 border border-gray-300 relative items-center justify-center flex grid-cols-2 grid">
                <div className="w-full h-full border border-gray-400"></div>
                <div className="w-full h-full border border-gray-400 border-l-0"></div>
                <div className="w-full h-full border border-gray-400 border-t-0"></div>
                <div className="w-full h-full border border-gray-400 border-t-0 border-l-0"></div>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500 tracking-widest uppercase">Sistema de Recursos Humanos</p>
          </div>
        </div>

        {/* Lado Derecho - Formulario Minimalista */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-14 lg:p-16 bg-white">
          <div>
            <div className="mb-10 text-center lg:text-left">
              <h1 className="text-3xl font-light text-gray-900 mb-2 tracking-tight">Acceso</h1>
              <p className="text-gray-500 font-light text-sm">Ingrese sus credenciales.</p>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col">
              <div className="mb-8">
                <TextField
                  fullWidth
                  placeholder="Nombre de usuario"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: '8px',
                      bgcolor: '#fafafa',
                      '& fieldset': { borderColor: '#e5e7eb' },
                      '&:hover fieldset': { borderColor: '#d1d5db !important' },
                      '&.Mui-focused fieldset': { borderColor: '#111111 !important', borderWidth: '1px' },
                      fontWeight: 300,
                    }
                  }}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockClosedIcon className="h-5 w-5 text-gray-400" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                          {showPassword ? <EyeSlashIcon className="h-4 w-4 text-gray-400" /> : <EyeIcon className="h-4 w-4 text-gray-400" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: '8px',
                      bgcolor: '#fafafa',
                      '& fieldset': { borderColor: '#e5e7eb' },
                      '&:hover fieldset': { borderColor: '#d1d5db !important' },
                      '&.Mui-focused fieldset': { borderColor: '#111111 !important', borderWidth: '1px' },
                      fontWeight: 300,
                    }
                  }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {errorText && (
                <p className="text-red-500 font-light text-sm text-center">{errorText}</p>
              )}

              <div className="flex items-center justify-between text-sm mt-2 mb-8">
                <label className="flex items-center text-gray-500 font-light cursor-pointer group">
                  <input type="checkbox" className="mr-2.5 rounded-sm border-gray-300 text-black focus:ring-black transition-all" />
                  <span className="group-hover:text-gray-800 transition-colors">Recordarme</span>
                </label>
                <a href="#" className="font-light text-gray-500 hover:text-black transition-colors">
                  ¿Recuperar clave?
                </a>
              </div>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                disableElevation
                sx={{
                  py: 1.5,
                  mt: 4,
                  bgcolor: '#111111',
                  color: 'white',
                  textTransform: 'none',
                  fontSize: '15px',
                  fontWeight: 300,
                  letterSpacing: '0.05em',
                  borderRadius: '8px',
                  '&:hover': {
                    bgcolor: '#000000',
                  }
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Ingresar'}
              </Button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
