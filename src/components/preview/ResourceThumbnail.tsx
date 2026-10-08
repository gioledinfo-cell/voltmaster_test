import React, { useState } from 'react';
import {
  Truck,
  Wrench,
  Package,
  Building2,
  HardHat,
  Eye,
  Image as ImageIcon,
} from 'lucide-react';
import { PhotoLightboxModal, PhotoLightboxData } from './PhotoLightboxModal';

export type ResourceCategory = 'mezzo' | 'attrezzatura' | 'materiale' | 'cantiere' | 'dipendente' | 'generico';
export type ThumbnailSize = 'micro' | 'sm' | 'md' | 'lg' | 'mobile' | 'xl';

export interface ResourceThumbnailProps {
  imageUrl?: string | null;
  category: ResourceCategory;
  alt: string;
  code?: string;
  title?: string;
  subtitle?: string;
  size?: ThumbnailSize;
  clickable?: boolean;
  className?: string;
  details?: { label: string; value: string | number }[];
  badgeText?: string;
}

export const ResourceThumbnail: React.FC<ResourceThumbnailProps> = ({
  imageUrl,
  category,
  alt,
  code,
  title,
  subtitle,
  size = 'md',
  clickable = true,
  className = '',
  details,
  badgeText,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Size styling maps
  const sizeClasses: Record<ThumbnailSize, string> = {
    micro: 'w-7 h-7 min-w-[28px] min-h-[28px] rounded-md text-xs',
    sm: 'w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg text-sm',
    md: 'w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl text-base',
    lg: 'w-14 h-14 min-w-[56px] min-h-[56px] rounded-xl text-lg',
    mobile: 'w-16 h-16 min-w-[64px] min-h-[64px] rounded-2xl text-xl',
    xl: 'w-20 h-20 min-w-[80px] min-h-[80px] rounded-2xl text-2xl',
  };

  // Category Theme Styles
  const getCategoryStyles = () => {
    switch (category) {
      case 'mezzo':
        return {
          bg: 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
          icon: <Truck className="w-1/2 h-1/2" />,
          emoji: '🚜',
        };
      case 'attrezzatura':
        return {
          bg: 'bg-purple-500/15 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
          icon: <Wrench className="w-1/2 h-1/2" />,
          emoji: '🔧',
        };
      case 'materiale':
        return {
          bg: 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          icon: <Package className="w-1/2 h-1/2" />,
          emoji: '📦',
        };
      case 'cantiere':
        return {
          bg: 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          icon: <Building2 className="w-1/2 h-1/2" />,
          emoji: '🏗️',
        };
      case 'dipendente':
        return {
          bg: 'bg-cyan-500/15 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
          icon: <HardHat className="w-1/2 h-1/2" />,
          emoji: '👷',
        };
      default:
        return {
          bg: 'bg-slate-500/15 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30',
          icon: <ImageIcon className="w-1/2 h-1/2" />,
          emoji: '📷',
        };
    }
  };

  const catStyle = getCategoryStyles();
  const hasValidImage = Boolean(imageUrl && !hasError);

  const handleClick = (e: React.MouseEvent) => {
    if (!clickable || !hasValidImage) return;
    e.stopPropagation();
    setIsLightboxOpen(true);
  };

  const lightboxData: PhotoLightboxData = {
    imageUrl: imageUrl || '',
    title: title || alt,
    code,
    category: category.toUpperCase(),
    subtitle,
    details,
  };

  return (
    <>
      <div
        onClick={handleClick}
        className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden border transition-all ${
          sizeClasses[size]
        } ${
          hasValidImage
            ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            : `${catStyle.bg} border`
        } ${
          clickable && hasValidImage
            ? 'cursor-pointer hover:shadow-md hover:border-amber-500 hover:scale-[1.03] group'
            : ''
        } ${className}`}
        title={hasValidImage && clickable ? `Ingrandisci foto: ${title || alt}` : title || alt}
      >
        {hasValidImage ? (
          <>
            <img
              src={imageUrl!}
              alt={alt}
              loading="lazy"
              onError={() => setHasError(true)}
              className="w-full h-full object-cover select-none"
            />
            {/* Quick Preview Hover Overlay for interactive sizes */}
            {clickable && size !== 'micro' && (
              <div className="absolute inset-0 bg-slate-950/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[0.5px]">
                <Eye className="w-4 h-4 text-white drop-shadow-md" />
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center w-full h-full select-none font-bold">
            {size === 'micro' || size === 'sm' ? (
              <span className="text-sm leading-none">{catStyle.emoji}</span>
            ) : (
              <div className="flex flex-col items-center justify-center gap-0.5">
                <span className="leading-none">{catStyle.emoji}</span>
              </div>
            )}
          </div>
        )}

        {/* Small corner category tag indicator if requested */}
        {badgeText && size !== 'micro' && (
          <span className="absolute bottom-0 right-0 bg-slate-900/85 text-white text-[8px] font-mono px-1 rounded-tl">
            {badgeText}
          </span>
        )}
      </div>

      {/* Lightbox Modal on Image Click */}
      {isLightboxOpen && (
        <PhotoLightboxModal
          data={lightboxData}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}
    </>
  );
};
