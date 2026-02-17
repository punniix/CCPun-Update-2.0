# 🎨 CCPUN Design Guidelines
## Liquid Glass Financial Advisor Theme

---

## 📋 Overview

| Property | Value |
|----------|-------|
| **Theme Style** | Liquid Glassmorphism |
| **Industry** | Financial Advisory |
| **Primary Language** | Thai (ภาษาไทย) |
| **Font** | Kanit (Google Fonts) |

---

## 🎨 Color Palette

### Primary Colors

| Name | HEX | HSL | RGB | Usage |
|------|-----|-----|-----|-------|
| **Background** | `#3B2E2E` | `hsl(0, 15%, 18%)` | `rgb(59, 46, 46)` | พื้นหลังหลัก |
| **Foreground** | `#FAF5F5` | `hsl(0, 10%, 98%)` | `rgb(250, 245, 245)` | ข้อความหลัก |

### Gold Accent Colors

| Name | HEX | HSL | RGB | Usage |
|------|-----|-----|-----|-------|
| **Gold Primary** | `#DCBE82` | `hsl(45, 60%, 70%)` | `rgb(220, 190, 130)` | Accent หลัก, CTA |
| **Gold Light** | `#E8D4A0` | `hsl(45, 65%, 78%)` | `rgb(232, 212, 160)` | Hover states |
| **Gold Dark** | `#C9A85C` | `hsl(45, 55%, 60%)` | `rgb(201, 168, 92)` | Emphasis |

### Neutral Colors

| Name | HEX | HSL | Usage |
|------|-----|-----|-------|
| **Card** | `#362929` | `hsl(0, 15%, 15%)` | Card backgrounds |
| **Muted** | `#4A3C3C` | `hsl(0, 12%, 26%)` | Secondary backgrounds |
| **Border** | `#524444` | `hsl(0, 12%, 32%)` | Borders, dividers |
| **Text Muted** | `#B3A8A8` | `hsl(0, 10%, 70%)` | Secondary text |

### Navy Colors (Alternative)

| Name | HEX | HSL | Usage |
|------|-----|-----|-------|
| **Navy 900** | `#241C1C` | `hsl(0, 20%, 12%)` | Darkest background |
| **Navy 800** | `#3B2E2E` | `hsl(0, 15%, 18%)` | Primary background |
| **Navy 700** | `#4A3C3C` | `hsl(0, 12%, 26%)` | Elevated surfaces |

---

## 🔤 Typography

### Font Family

```css
font-family: 'Kanit', sans-serif;
```

### Google Fonts Import

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### Font Weights

| Weight | Name | Usage |
|--------|------|-------|
| 300 | Light | Body text (optional) |
| 400 | Regular | Body text |
| 500 | Medium | Subheadings |
| 600 | SemiBold | Headings, buttons |
| 700 | Bold | Hero titles |

### Type Scale (Recommended)

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 48-72px | 700 | 1.1 |
| H2 | 36-48px | 600 | 1.2 |
| H3 | 24-30px | 600 | 1.3 |
| H4 | 20-24px | 500 | 1.4 |
| Body | 16-18px | 400 | 1.6 |
| Small | 14px | 400 | 1.5 |

---

## 📐 Spacing & Layout

### Border Radius

| Size | Value | Usage |
|------|-------|-------|
| Small | `8px` | Inputs, small elements |
| Medium | `12px` | Buttons, small cards |
| Large | `16px` (1rem) | Cards, containers |
| XLarge | `24px` | Hero sections |
| Full | `9999px` | Pills, circular buttons |

### Spacing Scale (Based on 4px)

| Name | Value |
|------|-------|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| 2xl | 48px |
| 3xl | 64px |

---

## 🌟 Glassmorphism Effects

### Glass Card

```css
.glass-card {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.12) 0%, 
    rgba(255, 255, 255, 0.06) 50%,
    rgba(255, 255, 255, 0.03) 100%
  );
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.25),
    0 2px 8px rgba(255, 255, 255, 0.05),
    inset 0 1px 1px rgba(255, 255, 255, 0.15),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1);
}

/* Shine overlay (use ::before pseudo-element) */
.glass-card::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.2) 0%, 
    rgba(255, 255, 255, 0.08) 30%,
    transparent 60%
  );
  border-radius: inherit;
}
```

### Glass Navigation

```css
.glass-nav {
  position: fixed;
  width: 100%;
  z-index: 50;
  background: linear-gradient(180deg,
    rgba(60, 50, 50, 0.85) 0%,
    rgba(50, 40, 40, 0.75) 100%
  );
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
}
```

---

## 🔘 Button Styles

### Gold Button (Primary CTA)

```css
.gold-button {
  position: relative;
  overflow: hidden;
  border-radius: 9999px;
  padding: 16px 32px;
  font-weight: 600;
  color: #241C1C;
  background: linear-gradient(135deg, 
    hsl(45, 60%, 70%) 0%, 
    hsl(45, 70%, 78%) 50%,
    hsl(45, 60%, 70%) 100%
  );
  background-size: 200% 200%;
  box-shadow: 
    0 4px 24px rgba(220, 190, 130, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  transition: all 0.3s ease;
}

.gold-button:hover {
  transform: translateY(-4px) scale(1.02);
  background-position: 100% 100%;
  box-shadow: 
    0 12px 40px rgba(220, 190, 130, 0.5),
    0 6px 20px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    inset 0 -2px 4px rgba(0, 0, 0, 0.1);
}

.gold-button:active {
  transform: translateY(-1px) scale(0.99);
}
```

### Glass Button (Secondary)

```css
.glass-button {
  position: relative;
  overflow: hidden;
  border-radius: 9999px;
  padding: 16px 32px;
  font-weight: 600;
  color: #FAF5F5;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.15) 0%, 
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.15),
    inset 0 1px 1px rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.glass-button:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.25),
    inset 0 1px 1px rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.3);
}
```

---

## ✨ Text Effects

### Gold Gradient Text

```css
.text-gold-gradient {
  background: linear-gradient(135deg, 
    hsl(45, 70%, 65%) 0%, 
    hsl(45, 80%, 75%) 50%, 
    hsl(45, 70%, 65%) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Mobile fallback */
@media (max-width: 768px) {
  .text-gold-gradient {
    -webkit-text-fill-color: hsl(45, 70%, 65%);
    background: none;
  }
}
```

---

## 🎭 Shadows

| Name | CSS Value | Usage |
|------|-----------|-------|
| **Glass** | `0 8px 32px rgba(0, 0, 0, 0.25)` | Cards, elevated surfaces |
| **Gold Glow** | `0 0 40px rgba(220, 190, 130, 0.3)` | Gold accent highlights |
| **Card** | `0 4px 24px rgba(0, 0, 0, 0.15)` | Subtle card elevation |
| **Gold Button** | `0 4px 24px rgba(220, 190, 130, 0.4)` | CTA buttons |

---

## 🎬 Animations

### Float Animation

```css
@keyframes float {
  0%, 100% {
    transform: translateY(0) translateX(0);
  }
  25% {
    transform: translateY(-20px) translateX(10px);
  }
  50% {
    transform: translateY(0) translateX(20px);
  }
  75% {
    transform: translateY(20px) translateX(10px);
  }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}
```

### Fade In Up

```css
@keyframes fade-in-up {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.8s ease-out forwards;
}
```

### Pulse Glow

```css
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(197, 160, 89, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(197, 160, 89, 0.5);
  }
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}
```

---

## 📱 WordPress Quick Start

### Add to Theme Customizer (Additional CSS)

```css
/* ========== CCPUN Theme for WordPress ========== */

/* Import Kanit Font */
@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap');

/* Base Styles */
body {
  font-family: 'Kanit', sans-serif;
  background-color: #3B2E2E;
  color: #FAF5F5;
  line-height: 1.6;
}

/* Headings */
h1, h2, h3, h4, h5, h6 {
  font-family: 'Kanit', sans-serif;
  font-weight: 600;
  color: #FAF5F5;
}

/* Links */
a {
  color: #DCBE82;
  text-decoration: none;
  transition: color 0.3s ease;
}

a:hover {
  color: #E8D4A0;
}

/* Buttons */
.wp-block-button__link,
button,
input[type="submit"] {
  font-family: 'Kanit', sans-serif;
  background: linear-gradient(135deg, #DCBE82 0%, #E8D4A0 50%, #DCBE82 100%);
  color: #241C1C;
  border: none;
  border-radius: 9999px;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.wp-block-button__link:hover,
button:hover,
input[type="submit"]:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(220, 190, 130, 0.4);
}

/* Cards / Blocks */
.wp-block-group,
.wp-block-cover,
article {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.08) 0%, 
    rgba(255, 255, 255, 0.03) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
}

/* Forms */
input[type="text"],
input[type="email"],
input[type="tel"],
textarea {
  font-family: 'Kanit', sans-serif;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: #FAF5F5;
  padding: 12px 16px;
}

input::placeholder,
textarea::placeholder {
  color: #B3A8A8;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #DCBE82;
  box-shadow: 0 0 0 2px rgba(220, 190, 130, 0.2);
}
```

---

## 📁 File Structure Reference

```
src/
├── index.css          # Main CSS with design tokens
├── App.tsx            # Main app component
├── components/
│   ├── Navbar.tsx     # Glass navigation
│   ├── HeroSection.tsx
│   ├── ServicesSection.tsx
│   └── ...
└── assets/
    ├── hero-bg.jpg
    └── logos/
```

---

## 📞 Brand Information

| Property | Value |
|----------|-------|
| **Brand Name** | CCPUN |
| **Industry** | Financial Advisory |
| **Target Market** | Thailand |
| **Logo Style** | Text-based with gold gradient |

---

## ✅ Checklist for Implementation

- [ ] Import Kanit font from Google Fonts
- [ ] Set dark background (#3B2E2E)
- [ ] Use gold (#DCBE82) for CTAs and accents
- [ ] Apply glassmorphism effects to cards
- [ ] Use rounded corners (16px for cards, full for buttons)
- [ ] Add hover animations to interactive elements
- [ ] Ensure text contrast meets accessibility standards
- [ ] Test on mobile devices

---

*Generated from CCPUN Financial Advisor Website*
*Design System Version: 1.0*
