import React from 'react';
import { HeroGeometric } from '../components/ui/shape-landing-hero';
import { Link } from 'react-router-dom';

function HeroDemo() {
  return (
    <div className="hero-demo-page">
      <HeroGeometric 
        badge="Satıcıyız"
        title1="Dijital Satışınızı" 
        title2="Optimize Edin" 
      />
    </div>
  );
}

export default HeroDemo; 