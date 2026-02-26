import React, { useState } from 'react';
import { Theme } from '../data/themes';
import {
  Search,
  ArrowRight,
  Wifi,
  Key,
  Car,
  Utensils,
  ChevronLeft,
  Clock,
  ChevronRight,
  ShoppingBag,
  Calendar,
  Info,
  FileText,
  BookOpen,
  MessageCircle,
  MapPin,
  Star,
  AlertTriangle,
  Sparkles,
  Home,
  Compass,
  Heart,
  User } from
'lucide-react';
interface GuestGuideProps {
  theme: Theme;
}
type Screen = 'home' | 'detail';
export function GuestGuide({ theme }: GuestGuideProps) {
  const [screen, setScreen] = useState<Screen>('home');
  const navigateTo = (s: Screen) => {
    setScreen(s);
    const el = document.getElementById('guide-scroll');
    if (el) el.scrollTop = 0;
  };
  return (
    <div
      id="guide-scroll"
      className="relative h-full w-full overflow-y-auto no-scrollbar"
      style={{
        transition: 'background 0.4s ease'
      }}>

      {screen === 'home' ?
      <HomeScreen theme={theme} onNavigate={() => navigateTo('detail')} /> :

      <DetailScreen theme={theme} onBack={() => navigateTo('home')} />
      }
      <FloatingChat theme={theme} />
    </div>);

}
// ─── FLOATING CHAT ──────────────────────────────────────────────────────────
function FloatingChat({ theme }: {theme: Theme;}) {
  if (theme.id === 'airbnb')
  return (
    <button
      className="absolute bottom-20 right-5 h-14 w-14 rounded-full flex items-center justify-center shadow-xl z-50 hover:scale-105 transition-transform"
      style={{
        background: '#FF385C',
        color: '#fff'
      }}>

        <MessageCircle className="h-6 w-6" />
      </button>);

  if (theme.id === 'modern')
  return (
    <button className="absolute bottom-6 right-5 h-14 w-14 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-xl hover:scale-105 transition-transform z-50">
        <MessageCircle className="h-6 w-6" />
      </button>);

  if (theme.id === 'cozy')
  return (
    <button
      className="absolute bottom-6 right-5 h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg z-50 hover:scale-105 transition-transform"
      style={{
        background: '#8B5E3C',
        color: '#FDF6EE'
      }}>

        <MessageCircle className="h-6 w-6" />
      </button>);

  if (theme.id === 'urban')
  return (
    <button
      className="absolute bottom-6 right-5 h-14 w-14 rounded-none flex items-center justify-center z-50 hover:scale-105 transition-transform"
      style={{
        background: '#00E5FF',
        color: '#000'
      }}>

        <MessageCircle className="h-6 w-6" />
      </button>);

  if (theme.id === 'coastal')
  return (
    <button
      className="absolute bottom-6 right-5 h-14 w-14 rounded-full flex items-center justify-center shadow-lg z-50 hover:scale-105 transition-transform"
      style={{
        background: '#0EA5E9',
        color: '#fff'
      }}>

        <MessageCircle className="h-6 w-6" />
      </button>);

  // luxury
  return (
    <button
      className="absolute bottom-6 right-5 h-14 w-14 flex items-center justify-center z-50 hover:scale-105 transition-transform"
      style={{
        background: '#1B2A4A',
        color: '#C9A84C',
        border: '1px solid #C9A84C'
      }}>

      <MessageCircle className="h-6 w-6" />
    </button>);

}
// ─── HOME SCREENS ────────────────────────────────────────────────────────────
function HomeScreen({
  theme,
  onNavigate



}: {theme: Theme;onNavigate: () => void;}) {
  switch (theme.id) {
    case 'modern':
      return <ModernHome onNavigate={onNavigate} />;
    case 'cozy':
      return <CozyHome onNavigate={onNavigate} />;
    case 'urban':
      return <UrbanHome onNavigate={onNavigate} />;
    case 'coastal':
      return <CoastalHome onNavigate={onNavigate} />;
    case 'luxury':
      return <LuxuryHome onNavigate={onNavigate} />;
    case 'airbnb':
      return <AirbnbHome onNavigate={onNavigate} />;
  }
}
function DetailScreen({ theme, onBack }: {theme: Theme;onBack: () => void;}) {
  switch (theme.id) {
    case 'modern':
      return <ModernDetail onBack={onBack} />;
    case 'cozy':
      return <CozyDetail onBack={onBack} />;
    case 'urban':
      return <UrbanDetail onBack={onBack} />;
    case 'coastal':
      return <CoastalDetail onBack={onBack} />;
    case 'luxury':
      return <LuxuryDetail onBack={onBack} />;
    case 'airbnb':
      return <AirbnbDetail onBack={onBack} />;
  }
}
// ═══════════════════════════════════════════════════════════════════════════
// THEME 1: MODERN MINIMAL
// ═══════════════════════════════════════════════════════════════════════════
function ModernHome({ onNavigate }: {onNavigate: () => void;}) {
  return (
    <div className="font-inter bg-gray-50 min-h-full pb-24">
      {/* Hero */}
      <div className="relative h-72">
        <img
          src="/image.png"
          className="w-full h-full object-cover"
          alt="" />

        <div
          className="absolute inset-0"
          style={{
            background:
            'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)'
          }} />

        <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md rounded-full px-3 py-1 text-white text-xs font-medium tracking-wider">
          ES
        </div>
        <div className="absolute bottom-6 left-6 text-white">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase opacity-70 mb-1">
            Bienvenido a Casa
          </p>
          <h1 className="text-5xl font-bold leading-none mb-1">Hola</h1>
          <p className="text-base font-light opacity-80">Villa Enrique</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 -mt-5 relative z-10">
        {/* Search */}
        <div className="bg-white rounded-2xl shadow-lg flex items-center px-4 py-3 mb-6">
          <Search className="h-4 w-4 text-gray-400 mr-3 shrink-0" />
          <span className="text-sm text-gray-400 flex-1">
            ¿En qué puedo ayudarte hoy?
          </span>
          <div className="h-8 w-8 rounded-full bg-gray-900 flex items-center justify-center">
            <ArrowRight className="h-4 w-4 text-white" />
          </div>
        </div>

        <p className="text-center text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-400 mb-6">
          Tu Concierge Digital · Las Rozas de Madrid
        </p>

        {/* Quick Links */}
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
          Preguntas Frecuentes
        </p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
          {
            icon: Wifi,
            label: 'WiFi'
          },
          {
            icon: Key,
            label: 'Acceso'
          },
          {
            icon: Car,
            label: 'Parking'
          },
          {
            icon: Utensils,
            label: 'Comer'
          }].
          map(({ icon: Icon, label }) =>
          <button
            key={label}
            className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">

              <Icon className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-semibold text-gray-800">
                {label}
              </span>
            </button>
          )}
        </div>

        {/* Guide Card */}
        <button
          onClick={onNavigate}
          className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">

          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-1">
              Tu Estancia
            </p>
            <h3 className="text-lg font-bold text-gray-900 mb-0.5">
              Guía de la Casa
            </h3>
            <p className="text-xs text-gray-500">Todo lo que necesitas saber</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </div>
        </button>
      </div>
      <p className="text-center text-[9px] text-gray-300 tracking-[0.25em] uppercase mt-10">
        Powered by Guideflow
      </p>
    </div>);

}
function ModernDetail({ onBack }: {onBack: () => void;}) {
  return (
    <div className="font-inter bg-gray-50 min-h-full pb-24">
      <div className="relative h-52">
        <img
          src="/image.png"
          className="w-full h-full object-cover"
          alt="" />

        <div className="absolute inset-0 bg-black/40" />
        <button
          onClick={onBack}
          className="absolute top-12 left-5 h-9 w-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">

          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="absolute bottom-5 left-5 text-white">
          <p className="text-[10px] tracking-widest uppercase opacity-70 mb-0.5">
            Tu Guía
          </p>
          <h1 className="text-xl font-bold">Villa Enrique</h1>
        </div>
      </div>

      <div className="px-5 -mt-4 relative z-10 space-y-4">
        {/* Rec Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>17:50 · Buenas Tardes</span>
            </div>
            <span className="bg-amber-400 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
              Recomendación
            </span>
          </div>
          <h2 className="text-base font-bold text-gray-900 mb-1.5">
            Restaurante Japonés Sakura
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed mb-3">
            El sushi es excelente, pero también te recomiendo probar el ramen.
            Tienen menú degustación.
          </p>
          <button className="flex items-center text-xs font-bold text-gray-900 uppercase tracking-wider">
            Ver Recomendaciones <ChevronRight className="h-3 w-3 ml-1" />
          </button>
        </div>

        {/* Essential */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
            Lo Indispensable
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button className="bg-gray-900 text-white rounded-xl p-3 flex flex-col items-center gap-1.5">
              <Key className="h-5 w-5" />
              <span className="text-[9px] font-bold uppercase tracking-wide">
                Check In
              </span>
            </button>
            <button className="bg-white border border-gray-100 rounded-xl p-3 flex flex-col items-center gap-1.5 shadow-sm">
              <Wifi className="h-5 w-5 text-gray-600" />
              <span className="text-[9px] font-bold uppercase tracking-wide text-gray-700">
                WiFi
              </span>
            </button>
            <button className="bg-red-50 border border-red-100 rounded-xl p-3 flex flex-col items-center gap-1.5">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-[9px] font-bold uppercase tracking-wide text-red-500">
                SOS
              </span>
            </button>
          </div>
        </div>

        {/* Discover */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
            Descubre Las Rozas
          </p>
          <div className="space-y-2">
            {[
            {
              icon: Utensils,
              t: 'Gastronomía',
              s: 'Restaurantes locales'
            },
            {
              icon: Calendar,
              t: 'Qué Hacer',
              s: 'Actividades'
            },
            {
              icon: ShoppingBag,
              t: 'Compras',
              s: 'Tiendas y mercados'
            }].
            map(({ icon: Icon, t, s }) =>
            <button
              key={t}
              className="w-full bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm border border-gray-100">

                <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-gray-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold text-gray-900">{t}</p>
                  <p className="text-xs text-gray-500">{s}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </button>
            )}
          </div>
        </div>

        {/* House */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
            Sobre la Casa
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
            {
              icon: Info,
              l: 'Info'
            },
            {
              icon: FileText,
              l: 'Normas'
            },
            {
              icon: BookOpen,
              l: 'Manual'
            }].
            map(({ icon: Icon, l }) =>
            <button
              key={l}
              className="bg-white rounded-xl p-3 flex flex-col items-center gap-1.5 shadow-sm border border-gray-100">

                <Icon className="h-5 w-5 text-gray-500" />
                <span className="text-[9px] font-bold uppercase tracking-wide text-gray-600">
                  {l}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
      <p className="text-center text-[9px] text-gray-300 tracking-[0.25em] uppercase mt-10">
        Powered by Guideflow
      </p>
    </div>);

}
// ═══════════════════════════════════════════════════════════════════════════
// THEME 2: WARM BOUTIQUE
// ═══════════════════════════════════════════════════════════════════════════
function CozyHome({ onNavigate }: {onNavigate: () => void;}) {
  return (
    <div
      className="font-lato min-h-full pb-24"
      style={{
        background: '#FDF6EE'
      }}>

      {/* Hero - taller, warm overlay */}
      <div className="relative h-80">
        <img
          src="/image.png"
          className="w-full h-full object-cover"
          alt="" />

        <div
          className="absolute inset-0"
          style={{
            background:
            'linear-gradient(to top, rgba(90,45,10,0.9) 0%, rgba(140,80,30,0.3) 50%, transparent 100%)'
          }} />

        <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md rounded-lg px-3 py-1 text-white text-xs font-medium tracking-wider">
          ES
        </div>
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8">
          <p
            className="text-xs tracking-[0.2em] uppercase mb-2"
            style={{
              color: '#F5C89A'
            }}>

            Bienvenido a Casa
          </p>
          <h1 className="font-playfair text-5xl italic font-bold text-white leading-none mb-1">
            Hola,
          </h1>
          <p className="font-playfair text-xl text-white/80 italic">
            Villa Enrique
          </p>
        </div>
      </div>

      {/* Warm content area */}
      <div className="px-5 pt-6">
        {/* Search - rectangular, warm */}
        <div
          className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl border"
          style={{
            background: '#fff',
            borderColor: '#E8D5BE'
          }}>

          <Search
            className="h-4 w-4 shrink-0"
            style={{
              color: '#C4956A'
            }} />

          <span
            className="text-sm flex-1"
            style={{
              color: '#9C7B5E'
            }}>

            ¿En qué puedo ayudarte hoy?
          </span>
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{
              background: '#8B5E3C'
            }}>

            <ArrowRight className="h-4 w-4 text-white" />
          </div>
        </div>

        <p
          className="text-center text-[10px] tracking-[0.18em] uppercase mb-7"
          style={{
            color: '#C4956A'
          }}>

          Tu Concierge Digital · Las Rozas de Madrid
        </p>

        {/* Quick Links - VERTICAL LIST style */}
        <p
          className="font-playfair text-xs italic mb-4"
          style={{
            color: '#9C7B5E'
          }}>

          Preguntas frecuentes
        </p>
        <div className="space-y-2 mb-7">
          {[
          {
            icon: Wifi,
            label: 'WiFi',
            sub: 'Contraseña y red'
          },
          {
            icon: Key,
            label: 'Acceso',
            sub: 'Cómo entrar'
          },
          {
            icon: Car,
            label: 'Parking',
            sub: 'Dónde aparcar'
          },
          {
            icon: Utensils,
            label: 'Comer',
            sub: 'Recomendaciones'
          }].
          map(({ icon: Icon, label, sub }) =>
          <button
            key={label}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl"
            style={{
              background: '#fff',
              border: '1px solid #E8D5BE',
              borderLeft: '3px solid #C4956A'
            }}>

              <Icon
              className="h-5 w-5 shrink-0"
              style={{
                color: '#8B5E3C'
              }} />

              <div className="text-left">
                <p
                className="text-sm font-bold"
                style={{
                  color: '#3D2B1F'
                }}>

                  {label}
                </p>
                <p
                className="text-xs"
                style={{
                  color: '#9C7B5E'
                }}>

                  {sub}
                </p>
              </div>
              <ChevronRight
              className="h-4 w-4 ml-auto"
              style={{
                color: '#C4956A'
              }} />

            </button>
          )}
        </div>

        {/* Guide Card - banner style */}
        <button
          onClick={onNavigate}
          className="w-full rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #8B5E3C 0%, #C4956A 100%)'
          }}>

          <div className="p-5 flex items-center justify-between">
            <div className="text-left">
              <p
                className="text-[10px] tracking-widest uppercase mb-1"
                style={{
                  color: '#F5C89A'
                }}>

                Tu Estancia
              </p>
              <h3 className="font-playfair text-xl font-bold text-white mb-0.5">
                Guía de la Casa
              </h3>
              <p className="text-xs text-white/70">
                Todo lo que necesitas saber
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <ChevronRight className="h-5 w-5 text-white" />
            </div>
          </div>
        </button>
      </div>
      <p
        className="text-center text-[9px] tracking-[0.25em] uppercase mt-10"
        style={{
          color: '#D4B896'
        }}>

        Powered by Guideflow
      </p>
    </div>);

}
function CozyDetail({ onBack }: {onBack: () => void;}) {
  return (
    <div
      className="font-lato min-h-full pb-24"
      style={{
        background: '#FDF6EE'
      }}>

      <div className="relative h-52">
        <img
          src="/image.png"
          className="w-full h-full object-cover"
          alt="" />

        <div
          className="absolute inset-0"
          style={{
            background:
            'linear-gradient(to top, rgba(90,45,10,0.8) 0%, rgba(0,0,0,0.2) 100%)'
          }} />

        <button
          onClick={onBack}
          className="absolute top-12 left-5 h-9 w-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">

          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="absolute bottom-5 left-5 text-white">
          <p className="text-[10px] tracking-widest uppercase opacity-70 mb-0.5">
            Tu Guía
          </p>
          <h1 className="font-playfair text-2xl italic font-bold">
            Villa Enrique
          </h1>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Rec Card - note style */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: '#fff',
            border: '1px solid #E8D5BE',
            borderLeft: '4px solid #C4956A'
          }}>

          <div className="flex items-center justify-between mb-3">
            <div
              className="flex items-center gap-1.5 text-xs"
              style={{
                color: '#9C7B5E'
              }}>

              <Clock className="h-3 w-3" />
              <span>17:50 · Buenas Tardes</span>
            </div>
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wide"
              style={{
                background: '#FEF3E2',
                color: '#8B5E3C'
              }}>

              Recomendación
            </span>
          </div>
          <h2
            className="font-playfair text-lg font-bold italic mb-2"
            style={{
              color: '#3D2B1F'
            }}>

            Restaurante Japonés Sakura
          </h2>
          <p
            className="text-xs leading-relaxed mb-3"
            style={{
              color: '#7A5C45'
            }}>

            El sushi es excelente, pero también te recomiendo probar el ramen.
            Tienen menú degustación.
          </p>
          <button
            className="flex items-center text-xs font-bold uppercase tracking-wider"
            style={{
              color: '#8B5E3C'
            }}>

            Ver Recomendaciones <ChevronRight className="h-3 w-3 ml-1" />
          </button>
        </div>

        {/* Essential */}
        <div>
          <p
            className="font-playfair text-xs italic mb-3"
            style={{
              color: '#9C7B5E'
            }}>

            Lo Indispensable
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              className="rounded-xl p-3 flex flex-col items-center gap-1.5"
              style={{
                background: '#8B5E3C',
                color: '#FDF6EE'
              }}>

              <Key className="h-5 w-5" />
              <span className="text-[9px] font-bold uppercase">Check In</span>
            </button>
            <button
              className="rounded-xl p-3 flex flex-col items-center gap-1.5"
              style={{
                background: '#fff',
                border: '1px solid #E8D5BE'
              }}>

              <Wifi
                className="h-5 w-5"
                style={{
                  color: '#8B5E3C'
                }} />

              <span
                className="text-[9px] font-bold uppercase"
                style={{
                  color: '#3D2B1F'
                }}>

                WiFi
              </span>
            </button>
            <button
              className="rounded-xl p-3 flex flex-col items-center gap-1.5"
              style={{
                background: '#FFF0F0',
                border: '1px solid #FECACA'
              }}>

              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-[9px] font-bold uppercase text-red-500">
                SOS
              </span>
            </button>
          </div>
        </div>

        {/* Discover */}
        <div>
          <p
            className="font-playfair text-xs italic mb-3"
            style={{
              color: '#9C7B5E'
            }}>

            Descubre Las Rozas de Madrid
          </p>
          <div className="space-y-2">
            {[
            {
              icon: Utensils,
              t: 'Gastronomía',
              s: 'Restaurantes locales'
            },
            {
              icon: Calendar,
              t: 'Qué Hacer',
              s: 'Actividades'
            },
            {
              icon: ShoppingBag,
              t: 'Compras',
              s: 'Tiendas y mercados'
            }].
            map(({ icon: Icon, t, s }) =>
            <button
              key={t}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{
                background: '#fff',
                border: '1px solid #E8D5BE'
              }}>

                <div
                className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: '#FEF3E2'
                }}>

                  <Icon
                  className="h-4 w-4"
                  style={{
                    color: '#8B5E3C'
                  }} />

                </div>
                <div className="text-left flex-1">
                  <p
                  className="text-sm font-bold"
                  style={{
                    color: '#3D2B1F'
                  }}>

                    {t}
                  </p>
                  <p
                  className="text-xs"
                  style={{
                    color: '#9C7B5E'
                  }}>

                    {s}
                  </p>
                </div>
                <ChevronRight
                className="h-4 w-4"
                style={{
                  color: '#C4956A'
                }} />

              </button>
            )}
          </div>
        </div>

        {/* House */}
        <div>
          <p
            className="font-playfair text-xs italic mb-3"
            style={{
              color: '#9C7B5E'
            }}>

            Sobre la Casa
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
            {
              icon: Info,
              l: 'Info'
            },
            {
              icon: FileText,
              l: 'Normas'
            },
            {
              icon: BookOpen,
              l: 'Manual'
            }].
            map(({ icon: Icon, l }) =>
            <button
              key={l}
              className="rounded-xl p-3 flex flex-col items-center gap-1.5"
              style={{
                background: '#fff',
                border: '1px solid #E8D5BE'
              }}>

                <Icon
                className="h-5 w-5"
                style={{
                  color: '#C4956A'
                }} />

                <span
                className="text-[9px] font-bold uppercase"
                style={{
                  color: '#3D2B1F'
                }}>

                  {l}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
      <p
        className="text-center text-[9px] tracking-[0.25em] uppercase mt-10"
        style={{
          color: '#D4B896'
        }}>

        Powered by Guideflow
      </p>
    </div>);

}
// ═══════════════════════════════════════════════════════════════════════════
// THEME 3: URBAN DARK
// ═══════════════════════════════════════════════════════════════════════════
function UrbanHome({ onNavigate }: {onNavigate: () => void;}) {
  return (
    <div
      className="font-montserrat min-h-full pb-24"
      style={{
        background: '#0F0F0F'
      }}>

      {/* Hero - full bleed, minimal overlay */}
      <div className="relative h-64">
        <img
          src="/image.png"
          className="w-full h-full object-cover"
          alt=""
          style={{
            filter: 'brightness(0.5) contrast(1.1)'
          }} />

        <div className="absolute top-4 right-4 border border-white/30 px-3 py-1 text-white text-xs font-bold tracking-widest">
          ES
        </div>
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
          <p
            className="text-[10px] font-bold tracking-[0.3em] uppercase mb-1"
            style={{
              color: '#00E5FF'
            }}>

            Bienvenido a Casa
          </p>
          <h1 className="font-oswald text-6xl font-bold text-white leading-none uppercase">
            Hola
          </h1>
          <p className="font-oswald text-lg text-white/60 uppercase tracking-widest">
            Villa Enrique
          </p>
        </div>
      </div>

      <div className="px-5 pt-5">
        {/* Search - dark */}
        <div
          className="flex items-center gap-3 mb-6 px-4 py-3"
          style={{
            background: '#1C1C1C',
            border: '1px solid #333'
          }}>

          <Search
            className="h-4 w-4 shrink-0"
            style={{
              color: '#00E5FF'
            }} />

          <span className="text-sm flex-1 text-white/50">
            ¿En qué puedo ayudarte hoy?
          </span>
          <div
            className="h-8 w-8 flex items-center justify-center"
            style={{
              background: '#00E5FF'
            }}>

            <ArrowRight className="h-4 w-4 text-black" />
          </div>
        </div>

        <p
          className="text-center text-[10px] font-bold tracking-[0.2em] uppercase mb-7"
          style={{
            color: '#555'
          }}>

          Tu Concierge Digital · Las Rozas de Madrid
        </p>

        {/* Quick Links - HORIZONTAL CHIPS */}
        <p
          className="text-[10px] font-bold uppercase tracking-widest mb-3"
          style={{
            color: '#555'
          }}>

          Preguntas Frecuentes
        </p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-7 pb-1">
          {[
          {
            icon: Wifi,
            label: 'WiFi'
          },
          {
            icon: Key,
            label: 'Acceso'
          },
          {
            icon: Car,
            label: 'Parking'
          },
          {
            icon: Utensils,
            label: 'Comer'
          }].
          map(({ icon: Icon, label }) =>
          <button
            key={label}
            className="flex items-center gap-2 px-4 py-2.5 shrink-0 font-bold text-sm"
            style={{
              background: '#1C1C1C',
              border: '1px solid #333',
              color: '#fff'
            }}>

              <Icon
              className="h-4 w-4"
              style={{
                color: '#00E5FF'
              }} />

              <span>{label}</span>
            </button>
          )}
        </div>

        {/* Guide Card - editorial */}
        <button
          onClick={onNavigate}
          className="w-full p-5 text-left"
          style={{
            background: '#1C1C1C',
            border: '1px solid #333',
            borderTop: '3px solid #00E5FF'
          }}>

          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-2"
            style={{
              color: '#00E5FF'
            }}>

            Tu Estancia
          </p>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-oswald text-2xl font-bold text-white uppercase mb-0.5">
                Guía de la Casa
              </h3>
              <p
                className="text-xs"
                style={{
                  color: '#666'
                }}>

                Todo lo que necesitas saber
              </p>
            </div>
            <ChevronRight
              className="h-6 w-6"
              style={{
                color: '#00E5FF'
              }} />

          </div>
        </button>
      </div>
      <p
        className="text-center text-[9px] font-bold tracking-[0.25em] uppercase mt-10"
        style={{
          color: '#333'
        }}>

        Powered by Guideflow
      </p>
    </div>);

}
function UrbanDetail({ onBack }: {onBack: () => void;}) {
  return (
    <div
      className="font-montserrat min-h-full pb-24"
      style={{
        background: '#0F0F0F'
      }}>

      <div className="relative h-48">
        <img
          src="/image.png"
          className="w-full h-full object-cover"
          alt=""
          style={{
            filter: 'brightness(0.4) contrast(1.2)'
          }} />

        <button
          onClick={onBack}
          className="absolute top-12 left-5 h-9 w-9 flex items-center justify-center text-white"
          style={{
            border: '1px solid #555'
          }}>

          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="absolute bottom-5 left-5 text-white">
          <p
            className="text-[10px] font-bold tracking-widest uppercase mb-0.5"
            style={{
              color: '#00E5FF'
            }}>

            Tu Guía
          </p>
          <h1 className="font-oswald text-2xl font-bold uppercase">
            Villa Enrique
          </h1>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Rec Card */}
        <div
          className="p-5"
          style={{
            background: '#1C1C1C',
            border: '1px solid #333',
            borderTop: '2px solid #00E5FF'
          }}>

          <div className="flex items-center justify-between mb-3">
            <div
              className="flex items-center gap-1.5 text-xs font-bold"
              style={{
                color: '#555'
              }}>

              <Clock className="h-3 w-3" />
              <span>17:50 · BUENAS TARDES</span>
            </div>
            <span
              className="text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest"
              style={{
                background: '#00E5FF',
                color: '#000'
              }}>

              Recomendación
            </span>
          </div>
          <h2 className="font-oswald text-xl font-bold text-white uppercase mb-2">
            Restaurante Japonés Sakura
          </h2>
          <p
            className="text-xs leading-relaxed mb-3"
            style={{
              color: '#888'
            }}>

            El sushi es excelente, pero también te recomiendo probar el ramen.
            Tienen menú degustación.
          </p>
          <button
            className="flex items-center text-xs font-bold uppercase tracking-widest"
            style={{
              color: '#00E5FF'
            }}>

            Ver Recomendaciones <ChevronRight className="h-3 w-3 ml-1" />
          </button>
        </div>

        {/* Essential - numbered */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span
              className="font-oswald text-3xl font-bold"
              style={{
                color: '#222'
              }}>

              01
            </span>
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{
                color: '#555'
              }}>

              Lo Indispensable
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              className="p-3 flex flex-col items-center gap-1.5"
              style={{
                background: '#fff',
                color: '#000'
              }}>

              <Key className="h-5 w-5" />
              <span className="text-[9px] font-bold uppercase">Check In</span>
            </button>
            <button
              className="p-3 flex flex-col items-center gap-1.5"
              style={{
                background: '#1C1C1C',
                border: '1px solid #333'
              }}>

              <Wifi
                className="h-5 w-5"
                style={{
                  color: '#00E5FF'
                }} />

              <span className="text-[9px] font-bold uppercase text-white">
                WiFi
              </span>
            </button>
            <button
              className="p-3 flex flex-col items-center gap-1.5"
              style={{
                background: '#1C1C1C',
                border: '1px solid #FF4444'
              }}>

              <AlertTriangle
                className="h-5 w-5"
                style={{
                  color: '#FF4444'
                }} />

              <span
                className="text-[9px] font-bold uppercase"
                style={{
                  color: '#FF4444'
                }}>

                SOS
              </span>
            </button>
          </div>
        </div>

        {/* Discover */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span
              className="font-oswald text-3xl font-bold"
              style={{
                color: '#222'
              }}>

              02
            </span>
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{
                color: '#555'
              }}>

              Descubre Las Rozas
            </p>
          </div>
          <div className="space-y-2">
            {[
            {
              icon: Utensils,
              t: 'Gastronomía',
              s: 'Restaurantes locales'
            },
            {
              icon: Calendar,
              t: 'Qué Hacer',
              s: 'Actividades'
            },
            {
              icon: ShoppingBag,
              t: 'Compras',
              s: 'Tiendas y mercados'
            }].
            map(({ icon: Icon, t, s }) =>
            <button
              key={t}
              className="w-full flex items-center gap-3 px-4 py-3"
              style={{
                background: '#1C1C1C',
                border: '1px solid #333'
              }}>

                <Icon
                className="h-4 w-4 shrink-0"
                style={{
                  color: '#00E5FF'
                }} />

                <div className="text-left flex-1">
                  <p className="text-sm font-bold text-white">{t}</p>
                  <p
                  className="text-xs"
                  style={{
                    color: '#666'
                  }}>

                    {s}
                  </p>
                </div>
                <ChevronRight
                className="h-4 w-4"
                style={{
                  color: '#444'
                }} />

              </button>
            )}
          </div>
        </div>

        {/* House */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span
              className="font-oswald text-3xl font-bold"
              style={{
                color: '#222'
              }}>

              03
            </span>
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{
                color: '#555'
              }}>

              Sobre la Casa
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
            {
              icon: Info,
              l: 'Info'
            },
            {
              icon: FileText,
              l: 'Normas'
            },
            {
              icon: BookOpen,
              l: 'Manual'
            }].
            map(({ icon: Icon, l }) =>
            <button
              key={l}
              className="p-3 flex flex-col items-center gap-1.5"
              style={{
                background: '#1C1C1C',
                border: '1px solid #333'
              }}>

                <Icon
                className="h-5 w-5"
                style={{
                  color: '#00E5FF'
                }} />

                <span className="text-[9px] font-bold uppercase text-white">
                  {l}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
      <p
        className="text-center text-[9px] font-bold tracking-[0.25em] uppercase mt-10"
        style={{
          color: '#333'
        }}>

        Powered by Guideflow
      </p>
    </div>);

}
// ═══════════════════════════════════════════════════════════════════════════
// THEME 4: COASTAL BREEZE
// ═══════════════════════════════════════════════════════════════════════════
function CoastalHome({ onNavigate }: {onNavigate: () => void;}) {
  const iconColors = ['#0EA5E9', '#06B6D4', '#F97316', '#10B981'];
  return (
    <div
      className="font-nunito min-h-full pb-24"
      style={{
        background: '#F0F9FF'
      }}>

      {/* Hero - blue tinted overlay */}
      <div className="relative h-72">
        <img
          src="/image.png"
          className="w-full h-full object-cover"
          alt="" />

        <div
          className="absolute inset-0"
          style={{
            background:
            'linear-gradient(to top, rgba(3,105,161,0.85) 0%, rgba(14,165,233,0.2) 60%, transparent 100%)'
          }} />

        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full px-3 py-1 text-white text-xs font-bold">
          ES
        </div>
        <div className="absolute bottom-6 left-6 text-white">
          <p className="text-xs font-bold tracking-widest uppercase opacity-80 mb-1">
            Bienvenido a Casa
          </p>
          <h1 className="text-5xl font-extrabold leading-none mb-1">Hola!</h1>
          <p className="text-lg font-semibold opacity-80">Villa Enrique</p>
        </div>
      </div>

      <div className="px-5 -mt-5 relative z-10">
        {/* Search - pill, colorful */}
        <div
          className="flex items-center gap-3 mb-6 px-4 py-3 rounded-full shadow-lg"
          style={{
            background: '#fff',
            boxShadow: '0 4px 20px rgba(14,165,233,0.15)'
          }}>

          <Search
            className="h-4 w-4 shrink-0"
            style={{
              color: '#0EA5E9'
            }} />

          <span
            className="text-sm flex-1"
            style={{
              color: '#94A3B8'
            }}>

            ¿En qué puedo ayudarte hoy?
          </span>
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center"
            style={{
              background: '#0EA5E9'
            }}>

            <ArrowRight className="h-4 w-4 text-white" />
          </div>
        </div>

        <p
          className="text-center text-[10px] font-bold tracking-widest uppercase mb-6"
          style={{
            color: '#0EA5E9'
          }}>

          Tu Concierge Digital · Las Rozas de Madrid
        </p>

        {/* Quick Links - ICON CIRCLES with colors */}
        <p
          className="text-[10px] font-bold uppercase tracking-widest mb-4"
          style={{
            color: '#94A3B8'
          }}>

          Preguntas Frecuentes
        </p>
        <div className="grid grid-cols-4 gap-3 mb-7">
          {[
          {
            icon: Wifi,
            label: 'WiFi',
            color: iconColors[0]
          },
          {
            icon: Key,
            label: 'Acceso',
            color: iconColors[1]
          },
          {
            icon: Car,
            label: 'Parking',
            color: iconColors[2]
          },
          {
            icon: Utensils,
            label: 'Comer',
            color: iconColors[3]
          }].
          map(({ icon: Icon, label, color }) =>
          <button key={label} className="flex flex-col items-center gap-2">
              <div
              className="h-14 w-14 rounded-full flex items-center justify-center shadow-md"
              style={{
                background: color
              }}>

                <Icon className="h-6 w-6 text-white" />
              </div>
              <span
              className="text-xs font-bold"
              style={{
                color: '#1E3A5F'
              }}>

                {label}
              </span>
            </button>
          )}
        </div>

        {/* Guide Card - gradient */}
        <button
          onClick={onNavigate}
          className="w-full rounded-3xl overflow-hidden shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)',
            boxShadow: '0 8px 25px rgba(14,165,233,0.3)'
          }}>

          <div className="p-5 flex items-center justify-between">
            <div className="text-left">
              <p className="text-[10px] font-bold tracking-widest uppercase mb-1 text-white/70">
                Tu Estancia
              </p>
              <h3 className="text-xl font-extrabold text-white mb-0.5">
                Guía de la Casa
              </h3>
              <p className="text-xs text-white/70">
                Todo lo que necesitas saber
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <ChevronRight className="h-5 w-5 text-white" />
            </div>
          </div>
        </button>
      </div>
      <p
        className="text-center text-[9px] font-bold tracking-[0.25em] uppercase mt-10"
        style={{
          color: '#BAE6FD'
        }}>

        Powered by Guideflow
      </p>
    </div>);

}
function CoastalDetail({ onBack }: {onBack: () => void;}) {
  return (
    <div
      className="font-nunito min-h-full pb-24"
      style={{
        background: '#F0F9FF'
      }}>

      <div className="relative h-52">
        <img
          src="/image.png"
          className="w-full h-full object-cover"
          alt="" />

        <div
          className="absolute inset-0"
          style={{
            background:
            'linear-gradient(to top, rgba(3,105,161,0.7) 0%, rgba(0,0,0,0.2) 100%)'
          }} />

        <button
          onClick={onBack}
          className="absolute top-12 left-5 h-9 w-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">

          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="absolute bottom-5 left-5 text-white">
          <p className="text-[10px] font-bold tracking-widest uppercase opacity-70 mb-0.5">
            Tu Guía
          </p>
          <h1 className="text-2xl font-extrabold">Villa Enrique</h1>
        </div>
      </div>

      <div className="px-5 -mt-4 relative z-10 space-y-4">
        {/* Rec Card */}
        <div
          className="rounded-3xl p-5 shadow-md"
          style={{
            background: '#fff',
            boxShadow: '0 4px 20px rgba(14,165,233,0.1)',
            borderTop: '3px solid #0EA5E9'
          }}>

          <div className="flex items-center justify-between mb-3">
            <div
              className="flex items-center gap-1.5 text-xs font-semibold"
              style={{
                color: '#94A3B8'
              }}>

              <Clock className="h-3 w-3" />
              <span>17:50 · Buenas Tardes</span>
            </div>
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
              style={{
                background: '#FFF7ED',
                color: '#F97316'
              }}>

              Recomendación
            </span>
          </div>
          <h2
            className="text-base font-extrabold mb-1.5"
            style={{
              color: '#1E3A5F'
            }}>

            Restaurante Japonés Sakura
          </h2>
          <p
            className="text-xs leading-relaxed mb-3"
            style={{
              color: '#64748B'
            }}>

            El sushi es excelente, pero también te recomiendo probar el ramen.
            Tienen menú degustación.
          </p>
          <button
            className="flex items-center text-xs font-bold uppercase tracking-wider"
            style={{
              color: '#0EA5E9'
            }}>

            Ver Recomendaciones <ChevronRight className="h-3 w-3 ml-1" />
          </button>
        </div>

        {/* Essential */}
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-3"
            style={{
              color: '#94A3B8'
            }}>

            Lo Indispensable
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              className="rounded-2xl p-3 flex flex-col items-center gap-1.5 shadow-md"
              style={{
                background: '#0EA5E9',
                color: '#fff'
              }}>

              <Key className="h-5 w-5" />
              <span className="text-[9px] font-bold uppercase">Check In</span>
            </button>
            <button
              className="rounded-2xl p-3 flex flex-col items-center gap-1.5 shadow-sm"
              style={{
                background: '#fff',
                border: '1px solid #E0F2FE'
              }}>

              <Wifi
                className="h-5 w-5"
                style={{
                  color: '#0EA5E9'
                }} />

              <span
                className="text-[9px] font-bold uppercase"
                style={{
                  color: '#1E3A5F'
                }}>

                WiFi
              </span>
            </button>
            <button
              className="rounded-2xl p-3 flex flex-col items-center gap-1.5"
              style={{
                background: '#FFF0F0',
                border: '1px solid #FECACA'
              }}>

              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-[9px] font-bold uppercase text-red-500">
                SOS
              </span>
            </button>
          </div>
        </div>

        {/* Discover */}
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-3"
            style={{
              color: '#94A3B8'
            }}>

            Descubre Las Rozas
          </p>
          <div className="space-y-2">
            {[
            {
              icon: Utensils,
              t: 'Gastronomía',
              s: 'Restaurantes locales',
              c: '#0EA5E9'
            },
            {
              icon: Calendar,
              t: 'Qué Hacer',
              s: 'Actividades',
              c: '#F97316'
            },
            {
              icon: ShoppingBag,
              t: 'Compras',
              s: 'Tiendas y mercados',
              c: '#10B981'
            }].
            map(({ icon: Icon, t, s, c }) =>
            <button
              key={t}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl shadow-sm"
              style={{
                background: '#fff',
                border: '1px solid #E0F2FE'
              }}>

                <div
                className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: c
                }}>

                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="text-left flex-1">
                  <p
                  className="text-sm font-bold"
                  style={{
                    color: '#1E3A5F'
                  }}>

                    {t}
                  </p>
                  <p
                  className="text-xs"
                  style={{
                    color: '#64748B'
                  }}>

                    {s}
                  </p>
                </div>
                <ChevronRight
                className="h-4 w-4"
                style={{
                  color: '#BAE6FD'
                }} />

              </button>
            )}
          </div>
        </div>

        {/* House */}
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-3"
            style={{
              color: '#94A3B8'
            }}>

            Sobre la Casa
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
            {
              icon: Info,
              l: 'Info',
              c: '#0EA5E9'
            },
            {
              icon: FileText,
              l: 'Normas',
              c: '#06B6D4'
            },
            {
              icon: BookOpen,
              l: 'Manual',
              c: '#0284C7'
            }].
            map(({ icon: Icon, l, c }) =>
            <button
              key={l}
              className="rounded-2xl p-3 flex flex-col items-center gap-1.5 shadow-sm"
              style={{
                background: '#fff',
                border: '1px solid #E0F2FE'
              }}>

                <Icon
                className="h-5 w-5"
                style={{
                  color: c
                }} />

                <span
                className="text-[9px] font-bold uppercase"
                style={{
                  color: '#1E3A5F'
                }}>

                  {l}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
      <p
        className="text-center text-[9px] font-bold tracking-[0.25em] uppercase mt-10"
        style={{
          color: '#BAE6FD'
        }}>

        Powered by Guideflow
      </p>
    </div>);

}
// ═══════════════════════════════════════════════════════════════════════════
// THEME 5: LUXURY ESTATE
// ═══════════════════════════════════════════════════════════════════════════
function LuxuryHome({ onNavigate }: {onNavigate: () => void;}) {
  return (
    <div
      className="font-jost min-h-full pb-24"
      style={{
        background: '#F9F7F4'
      }}>

      {/* Hero - full height, deep navy overlay */}
      <div className="relative h-96">
        <img
          src="/image.png"
          className="w-full h-full object-cover"
          alt=""
          style={{
            filter: 'brightness(0.85)'
          }} />

        <div
          className="absolute inset-0"
          style={{
            background:
            'linear-gradient(to top, rgba(27,42,74,0.95) 0%, rgba(27,42,74,0.4) 50%, transparent 100%)'
          }} />

        <div
          className="absolute top-4 right-4 text-xs tracking-[0.2em] uppercase"
          style={{
            color: 'rgba(201,168,76,0.9)'
          }}>

          ES ▾
        </div>
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8">
          {/* Gold divider */}
          <div
            className="w-8 h-px mb-4"
            style={{
              background: '#C9A84C'
            }} />

          <p
            className="text-[9px] tracking-[0.35em] uppercase mb-3"
            style={{
              color: '#C9A84C'
            }}>

            Bienvenido a Casa
          </p>
          <h1 className="font-cormorant text-6xl font-light text-white leading-none mb-2">
            Hola
          </h1>
          <p className="font-cormorant text-xl text-white/60 italic">
            Villa Enrique
          </p>
        </div>
      </div>

      <div className="px-6 pt-7">
        {/* Search - minimal underline */}
        <div
          className="flex items-center gap-3 mb-7 pb-3"
          style={{
            borderBottom: '1px solid #D4C5A9'
          }}>

          <Search
            className="h-4 w-4 shrink-0"
            style={{
              color: '#C9A84C'
            }} />

          <span
            className="text-sm flex-1 font-light"
            style={{
              color: '#8A8070'
            }}>

            ¿En qué puedo ayudarte hoy?
          </span>
          <ArrowRight
            className="h-4 w-4"
            style={{
              color: '#C9A84C'
            }} />

        </div>

        <p
          className="text-center text-[9px] tracking-[0.25em] uppercase mb-8"
          style={{
            color: '#8A8070'
          }}>

          Tu Concierge Digital · Las Rozas de Madrid
        </p>

        {/* Quick Links - HORIZONTAL, no cards */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className="h-px flex-1"
            style={{
              background: '#C9A84C',
              opacity: 0.4
            }} />

          <p
            className="text-[9px] tracking-[0.25em] uppercase px-3"
            style={{
              color: '#8A8070'
            }}>

            Consultas
          </p>
          <div
            className="h-px flex-1"
            style={{
              background: '#C9A84C',
              opacity: 0.4
            }} />

        </div>
        <div className="flex justify-between mb-8 pt-4">
          {[
          {
            icon: Wifi,
            label: 'WiFi'
          },
          {
            icon: Key,
            label: 'Acceso'
          },
          {
            icon: Car,
            label: 'Parking'
          },
          {
            icon: Utensils,
            label: 'Comer'
          }].
          map(({ icon: Icon, label }) =>
          <button key={label} className="flex flex-col items-center gap-2">
              <div
              className="h-12 w-12 flex items-center justify-center"
              style={{
                border: '1px solid #D4C5A9'
              }}>

                <Icon
                className="h-5 w-5"
                style={{
                  color: '#C9A84C'
                }} />

              </div>
              <span
              className="text-[9px] tracking-widest uppercase font-medium"
              style={{
                color: '#1B2A4A'
              }}>

                {label}
              </span>
            </button>
          )}
        </div>

        {/* Guide Card - elegant bordered */}
        <button
          onClick={onNavigate}
          className="w-full p-6 text-left"
          style={{
            background: '#fff',
            border: '1px solid #D4C5A9',
            borderLeft: '3px solid #C9A84C'
          }}>

          <p
            className="text-[9px] tracking-[0.3em] uppercase mb-3"
            style={{
              color: '#C9A84C'
            }}>

            Tu Estancia
          </p>
          <div className="flex items-end justify-between">
            <div>
              <h3
                className="font-cormorant text-2xl font-semibold mb-1"
                style={{
                  color: '#1B2A4A'
                }}>

                Guía de la Casa
              </h3>
              <p
                className="text-xs font-light"
                style={{
                  color: '#8A8070'
                }}>

                Todo lo que necesitas saber
              </p>
            </div>
            <ChevronRight
              className="h-5 w-5 mb-1"
              style={{
                color: '#C9A84C'
              }} />

          </div>
        </button>
      </div>
      <p
        className="text-center text-[9px] tracking-[0.25em] uppercase mt-10"
        style={{
          color: '#D4C5A9'
        }}>

        Powered by Guideflow
      </p>
    </div>);

}
function LuxuryDetail({ onBack }: {onBack: () => void;}) {
  return (
    <div
      className="font-jost min-h-full pb-24"
      style={{
        background: '#F9F7F4'
      }}>

      <div className="relative h-56">
        <img
          src="/image.png"
          className="w-full h-full object-cover"
          alt=""
          style={{
            filter: 'brightness(0.8)'
          }} />

        <div
          className="absolute inset-0"
          style={{
            background:
            'linear-gradient(to top, rgba(27,42,74,0.9) 0%, rgba(27,42,74,0.2) 100%)'
          }} />

        <button
          onClick={onBack}
          className="absolute top-12 left-5 h-9 w-9 flex items-center justify-center text-white"
          style={{
            border: '1px solid rgba(201,168,76,0.5)'
          }}>

          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="absolute bottom-5 left-6 text-white">
          <p
            className="text-[9px] tracking-[0.3em] uppercase mb-1"
            style={{
              color: '#C9A84C'
            }}>

            Tu Guía
          </p>
          <h1 className="font-cormorant text-2xl font-semibold">
            Villa Enrique
          </h1>
        </div>
      </div>

      <div className="px-6 pt-6 space-y-6">
        {/* Rec Card */}
        <div
          className="p-5"
          style={{
            background: '#fff',
            border: '1px solid #D4C5A9',
            borderLeft: '3px solid #C9A84C'
          }}>

          <div className="flex items-center justify-between mb-3">
            <div
              className="flex items-center gap-1.5 text-xs font-light"
              style={{
                color: '#8A8070'
              }}>

              <Clock className="h-3 w-3" />
              <span>17:50 · Buenas Tardes</span>
            </div>
            <span
              className="text-[9px] tracking-widest uppercase px-2 py-0.5"
              style={{
                background: '#F9F3E8',
                color: '#C9A84C',
                border: '1px solid #C9A84C'
              }}>

              Recomendación
            </span>
          </div>
          <h2
            className="font-cormorant text-xl font-semibold mb-2"
            style={{
              color: '#1B2A4A'
            }}>

            Restaurante Japonés Sakura
          </h2>
          <p
            className="text-xs font-light leading-relaxed mb-3"
            style={{
              color: '#8A8070'
            }}>

            El sushi es excelente, pero también te recomiendo probar el ramen.
            Tienen menú degustación.
          </p>
          <button
            className="flex items-center text-[10px] tracking-widest uppercase"
            style={{
              color: '#C9A84C'
            }}>

            Ver Recomendaciones <ChevronRight className="h-3 w-3 ml-1" />
          </button>
        </div>

        {/* Essential */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="h-px flex-1"
              style={{
                background: '#C9A84C',
                opacity: 0.3
              }} />

            <p
              className="text-[9px] tracking-[0.25em] uppercase px-2"
              style={{
                color: '#8A8070'
              }}>

              Lo Indispensable
            </p>
            <div
              className="h-px flex-1"
              style={{
                background: '#C9A84C',
                opacity: 0.3
              }} />

          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              className="p-3 flex flex-col items-center gap-1.5"
              style={{
                background: '#1B2A4A',
                color: '#C9A84C'
              }}>

              <Key className="h-5 w-5" />
              <span className="text-[9px] tracking-widest uppercase">
                Check In
              </span>
            </button>
            <button
              className="p-3 flex flex-col items-center gap-1.5"
              style={{
                background: '#fff',
                border: '1px solid #D4C5A9'
              }}>

              <Wifi
                className="h-5 w-5"
                style={{
                  color: '#C9A84C'
                }} />

              <span
                className="text-[9px] tracking-widest uppercase"
                style={{
                  color: '#1B2A4A'
                }}>

                WiFi
              </span>
            </button>
            <button
              className="p-3 flex flex-col items-center gap-1.5"
              style={{
                background: '#FFF8F8',
                border: '1px solid #FECACA'
              }}>

              <AlertTriangle className="h-5 w-5 text-red-400" />
              <span className="text-[9px] tracking-widest uppercase text-red-400">
                SOS
              </span>
            </button>
          </div>
        </div>

        {/* Discover */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="h-px flex-1"
              style={{
                background: '#C9A84C',
                opacity: 0.3
              }} />

            <p
              className="text-[9px] tracking-[0.25em] uppercase px-2"
              style={{
                color: '#8A8070'
              }}>

              Descubre Las Rozas
            </p>
            <div
              className="h-px flex-1"
              style={{
                background: '#C9A84C',
                opacity: 0.3
              }} />

          </div>
          <div className="space-y-2">
            {[
            {
              icon: Utensils,
              t: 'Gastronomía',
              s: 'Restaurantes locales'
            },
            {
              icon: Calendar,
              t: 'Qué Hacer',
              s: 'Actividades'
            },
            {
              icon: ShoppingBag,
              t: 'Compras',
              s: 'Tiendas y mercados'
            }].
            map(({ icon: Icon, t, s }) =>
            <button
              key={t}
              className="w-full flex items-center gap-4 px-4 py-3"
              style={{
                background: '#fff',
                border: '1px solid #D4C5A9'
              }}>

                <Icon
                className="h-4 w-4 shrink-0"
                style={{
                  color: '#C9A84C'
                }} />

                <div className="text-left flex-1">
                  <p
                  className="text-sm font-medium"
                  style={{
                    color: '#1B2A4A'
                  }}>

                    {t}
                  </p>
                  <p
                  className="text-xs font-light"
                  style={{
                    color: '#8A8070'
                  }}>

                    {s}
                  </p>
                </div>
                <ChevronRight
                className="h-4 w-4"
                style={{
                  color: '#D4C5A9'
                }} />

              </button>
            )}
          </div>
        </div>

        {/* House */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="h-px flex-1"
              style={{
                background: '#C9A84C',
                opacity: 0.3
              }} />

            <p
              className="text-[9px] tracking-[0.25em] uppercase px-2"
              style={{
                color: '#8A8070'
              }}>

              Sobre la Casa
            </p>
            <div
              className="h-px flex-1"
              style={{
                background: '#C9A84C',
                opacity: 0.3
              }} />

          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
            {
              icon: Info,
              l: 'Info'
            },
            {
              icon: FileText,
              l: 'Normas'
            },
            {
              icon: BookOpen,
              l: 'Manual'
            }].
            map(({ icon: Icon, l }) =>
            <button
              key={l}
              className="p-3 flex flex-col items-center gap-1.5"
              style={{
                background: '#fff',
                border: '1px solid #D4C5A9'
              }}>

                <Icon
                className="h-5 w-5"
                style={{
                  color: '#C9A84C'
                }} />

                <span
                className="text-[9px] tracking-widest uppercase"
                style={{
                  color: '#1B2A4A'
                }}>

                  {l}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
      <p
        className="text-center text-[9px] tracking-[0.25em] uppercase mt-10"
        style={{
          color: '#D4C5A9'
        }}>

        Powered by Guideflow
      </p>
    </div>);

}
// ═══════════════════════════════════════════════════════════════════════════
// THEME 6: AIRBNB STYLE
// ═══════════════════════════════════════════════════════════════════════════
function AirbnbHome({ onNavigate }: {onNavigate: () => void;}) {
  return (
    <div
      className="font-inter bg-white min-h-full"
      style={{
        paddingBottom: '140px'
      }}>

      {/* ── Search bar ── */}
      <div className="px-4 pt-10 pb-3">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-full"
          style={{
            boxShadow: '0 1px 12px rgba(0,0,0,0.18)',
            border: '1px solid #EBEBEB'
          }}>

          <Search className="h-4 w-4 text-gray-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-none">
              ¿A dónde vas?
            </p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              Cualquier lugar · Cualquier semana · Huéspedes
            </p>
          </div>
          <div className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center shrink-0">
            <svg
              className="h-3.5 w-3.5 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}>

              <path d="M3 6h18M6 12h12M9 18h6" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Category filter ── */}
      <div
        className="flex gap-5 overflow-x-auto no-scrollbar px-4 py-3 border-b"
        style={{
          borderColor: '#EBEBEB'
        }}>

        {[
        {
          emoji: '🏠',
          label: 'La Casa'
        },
        {
          emoji: '🏊',
          label: 'Piscinas'
        },
        {
          emoji: '🌊',
          label: 'Playa'
        },
        {
          emoji: '🌲',
          label: 'Cabañas'
        },
        {
          emoji: '🏔️',
          label: 'Montaña'
        },
        {
          emoji: '🏙️',
          label: 'Ciudad'
        }].
        map(({ emoji, label }, i) =>
        <button
          key={label}
          className="flex flex-col items-center gap-1.5 shrink-0 pb-1"
          style={{
            borderBottom:
            i === 0 ? '2px solid #222' : '2px solid transparent'
          }}>

            <span className="text-xl">{emoji}</span>
            <span
            className="text-[10px] font-medium"
            style={{
              color: i === 0 ? '#222' : '#717171'
            }}>

              {label}
            </span>
          </button>
        )}
      </div>

      {/* ── Listing card ── */}
      <div className="px-4 pt-5">
        <button onClick={onNavigate} className="w-full text-left">
          {/* Photo */}
          <div
            className="relative rounded-2xl overflow-hidden mb-3"
            style={{
              height: '240px'
            }}>

            <img
              src="/image.png"
              className="w-full h-full object-cover"
              alt="" />

            <button className="absolute top-3 right-3 p-1.5">
              <Heart
                className="h-5 w-5 drop-shadow-md"
                style={{
                  color: 'white',
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))'
                }} />

            </button>
          </div>

          {/* Listing info */}
          <div className="flex items-start justify-between mb-0.5">
            <p className="text-sm font-semibold text-gray-900">
              Las Rozas de Madrid, España
            </p>
            <div className="flex items-center gap-0.5 shrink-0 ml-2">
              <Star className="h-3.5 w-3.5 fill-current text-gray-900" />
              <span className="text-sm font-medium text-gray-900">4,97</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-0.5">
            Villa Enrique · Superanfitrión
          </p>
          <p className="text-sm text-gray-500 mb-1.5">3 may – 10 may</p>
          <p className="text-sm text-gray-900">
            <span className="font-semibold">135 €</span>
            <span className="text-gray-500 font-normal"> noche</span>
          </p>
        </button>
      </div>

      {/* ── Bottom Tab Bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 bg-white"
        style={{
          borderTop: '1px solid #EBEBEB'
        }}>

        <div className="flex items-center justify-around py-2 pb-3">
          {[
          {
            icon: Search,
            label: 'Explorar',
            active: true
          },
          {
            icon: Heart,
            label: 'Guardado',
            active: false
          },
          {
            icon: Home,
            label: 'Inicio',
            active: false
          },
          {
            icon: MessageCircle,
            label: 'Mensajes',
            active: false
          },
          {
            icon: User,
            label: 'Perfil',
            active: false
          }].
          map(({ icon: Icon, label, active }) =>
          <button
            key={label}
            className="flex flex-col items-center gap-0.5 px-2">

              <Icon
              className="h-5 w-5"
              style={{
                color: active ? '#FF385C' : '#717171'
              }} />

              <span
              className="text-[10px] font-medium"
              style={{
                color: active ? '#FF385C' : '#717171'
              }}>

                {label}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>);

}
function AirbnbDetail({ onBack }: {onBack: () => void;}) {
  return (
    <div
      className="font-inter bg-white min-h-full"
      style={{
        paddingBottom: '90px'
      }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-10 pb-3">
        <button
          onClick={onBack}
          className="h-9 w-9 rounded-full border border-gray-200 flex items-center justify-center bg-white shadow-sm">

          <ChevronLeft className="h-5 w-5 text-gray-800" />
        </button>
        <div className="flex items-center gap-3">
          <button className="h-9 w-9 rounded-full border border-gray-200 flex items-center justify-center bg-white shadow-sm">
            <svg
              className="h-4 w-4 text-gray-800"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}>

              <path d="M4 12v.01M12 12v.01M20 12v.01" strokeLinecap="round" />
            </svg>
          </button>
          <button className="h-9 w-9 rounded-full border border-gray-200 flex items-center justify-center bg-white shadow-sm">
            <Heart className="h-4 w-4 text-gray-800" />
          </button>
        </div>
      </div>

      {/* ── Full-width photo (no border radius, no margin) ── */}
      <div
        className="w-full"
        style={{
          height: '260px'
        }}>

        <img
          src="/image.png"
          className="w-full h-full object-cover"
          alt="" />

      </div>

      {/* ── Content ── */}
      <div className="px-5 pt-5">
        {/* Title + rating */}
        <h1 className="text-xl font-semibold text-gray-900 mb-1">
          Estudio actual en el paraíso naturista
        </h1>
        <div className="flex items-center gap-1 mb-1">
          <Star className="h-3.5 w-3.5 fill-current text-gray-900" />
          <span className="text-sm font-semibold text-gray-900">4,97</span>
          <span className="text-sm text-gray-500">·</span>
          <span className="text-sm text-gray-500 underline cursor-pointer">
            89 reseñas
          </span>
          <span className="text-sm text-gray-500">·</span>
          <span className="text-sm text-gray-500 underline cursor-pointer">
            Superanfitrión
          </span>
        </div>
        <p className="text-sm text-gray-500 underline cursor-pointer mb-4">
          Las Rozas de Madrid, España
        </p>

        {/* Divider */}
        <div
          className="h-px mb-4"
          style={{
            background: '#EBEBEB'
          }} />


        {/* Host row */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="h-12 w-12 rounded-full overflow-hidden shrink-0 border-2"
            style={{
              borderColor: '#FF385C'
            }}>

            <img
              src="/image.png"
              className="w-full h-full object-cover"
              alt="" />

          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Anfitrión: Francisco
            </p>
            <p className="text-xs text-gray-500">
              Superanfitrión · 9 años en Airbnb
            </p>
          </div>
        </div>

        {/* Divider */}
        <div
          className="h-px mb-4"
          style={{
            background: '#EBEBEB'
          }} />


        {/* Key info */}
        <div className="flex gap-4 mb-4 overflow-x-auto no-scrollbar pb-1">
          {[
          {
            n: '4',
            l: 'huéspedes'
          },
          {
            n: '2',
            l: 'habitaciones'
          },
          {
            n: '3',
            l: 'camas'
          },
          {
            n: '1',
            l: 'baño'
          }].
          map(({ n, l }) =>
          <div
            key={l}
            className="flex flex-col items-center shrink-0 px-3 py-2 rounded-xl"
            style={{
              background: '#F7F7F7'
            }}>

              <span className="text-base font-bold text-gray-900">{n}</span>
              <span className="text-xs text-gray-500">{l}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div
          className="h-px mb-4"
          style={{
            background: '#EBEBEB'
          }} />


        {/* Recommendation / Concierge tip */}
        <div
          className="flex gap-3 mb-4 p-4 rounded-2xl"
          style={{
            background: '#FFF8F8',
            border: '1px solid #FFE0E5'
          }}>

          <div
            className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: '#FF385C'
            }}>

            <Star className="h-4 w-4 text-white fill-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900 mb-0.5">
              17:50 · Recomendación del anfitrión
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              Restaurante Japonés Sakura — el sushi es excelente. Tienen menú
              degustación.
            </p>
            <button
              className="text-xs font-semibold underline mt-1"
              style={{
                color: '#FF385C'
              }}>

              Ver recomendaciones
            </button>
          </div>
        </div>

        {/* Divider */}
        <div
          className="h-px mb-4"
          style={{
            background: '#EBEBEB'
          }} />


        {/* Amenities */}
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          Lo que ofrece este alojamiento
        </h2>
        <div className="space-y-3 mb-4">
          {[
          {
            icon: '🌿',
            label: 'Vistas al jardín'
          },
          {
            icon: '🏊',
            label: 'Acceso a la piscina'
          },
          {
            icon: '🍳',
            label: 'Cocina'
          },
          {
            icon: '📶',
            label: 'WiFi gratuito en las instalaciones'
          },
          {
            icon: '🔑',
            label: 'Check-in con llave'
          },
          {
            icon: '🚗',
            label: 'Parking gratuito'
          }].
          map(({ icon, label }) =>
          <div key={label} className="flex items-center gap-3">
              <span className="text-lg w-6 text-center">{icon}</span>
              <span className="text-sm text-gray-700">{label}</span>
            </div>
          )}
        </div>

        <button
          className="w-full py-3 rounded-xl border text-sm font-semibold text-gray-900 mb-4"
          style={{
            borderColor: '#222'
          }}>

          Mostrar los 12 servicios
        </button>

        {/* Divider */}
        <div
          className="h-px mb-4"
          style={{
            background: '#EBEBEB'
          }} />


        {/* House rules */}
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          Qué debes saber
        </h2>
        <div className="space-y-2 mb-4">
          {[
          {
            icon: FileText,
            label: 'Normas de la casa',
            sub: 'Check-in: 15:00 – 22:00'
          },
          {
            icon: AlertTriangle,
            label: 'Seguridad y propiedad',
            sub: 'Detector de humo instalado'
          },
          {
            icon: Info,
            label: 'Política de cancelación',
            sub: 'Cancela antes del 1 may'
          }].
          map(({ icon: Icon, label, sub }) =>
          <button
            key={label}
            className="w-full flex items-center gap-3 py-2 text-left">

              <Icon className="h-5 w-5 text-gray-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-500">{sub}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* ── Sticky bottom bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 bg-white px-5 py-3"
        style={{
          borderTop: '1px solid #EBEBEB'
        }}>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-semibold text-gray-900">
                135 €
              </span>
              <span className="text-sm text-gray-500">/ noche</span>
            </div>
            <div className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-current text-gray-900" />
              <span className="text-xs font-medium text-gray-900">4,97</span>
              <span className="text-xs text-gray-400 ml-0.5">(89)</span>
            </div>
          </div>
          <button
            className="px-6 py-3 rounded-xl text-white text-sm font-semibold"
            style={{
              background:
              'linear-gradient(to right, #E61E4D, #E31C5F, #D70466)'
            }}>

            Reservar
          </button>
        </div>
      </div>
    </div>);

}