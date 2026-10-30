/**
 * HERO 3D SCENE - WANDRY PORTFOLIO
 * Globo Terrestre 3D Interativo com Matriz de Continentes & Cidades Globais
 * Destaque especial na cidade de Diamantina - MG (Brasil)
 * Desenvolvido com Three.js - 100% Responsivo e Otimizado para Mobile e Desktop (60 FPS)
 */

(function () {
  'use strict';

  // Garante inicialização mesmo se o DOM já estiver pronto no GitHub Pages
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroGlobe);
  } else {
    initHeroGlobe();
  }

  function initHeroGlobe() {
    const container = document.getElementById('hero-canvas-container');
    const canvas = document.getElementById('hero-3d-canvas');

    if (!container || !canvas || typeof THREE === 'undefined') {
      console.warn('Three.js ou elementos do Hero Globe não encontrados.');
      return;
    }

    // 1. Função defensiva de obtenção de dimensões (evita 0x0 em inicialização mobile / reflows)
    function getValidDimensions() {
      const rect = container.getBoundingClientRect();
      let w = rect.width || container.clientWidth || container.offsetWidth;
      let h = rect.height || container.clientHeight || container.offsetHeight;

      // Fallbacks defensivos se o CSS ainda estiver calculando estilos
      if (!w || w < 20) {
        w = Math.max(window.innerWidth - 32, 280);
      }
      if (!h || h < 20) {
        h = window.innerWidth < 640 ? 290 : 380;
      }
      return { width: Math.round(w), height: Math.round(h) };
    }

    let { width, height } = getValidDimensions();

    // 2. Cena & Câmera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.8);

    // 3. Renderizador WebGL com Configuração Segura
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    // 4. Iluminação Imediata (Ambiente + Hemisférica + Direcional + Rim)
    // Inserida no topo da cena para garantir que a geometria nunca fique escura
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.15);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(6, 6, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf1f5f9, 1.0);
    fillLight.position.set(-6, -2, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x10b981, 0.6);
    rimLight.position.set(-4, -5, -4);
    scene.add(rimLight);

    // 5. Grupo Raiz do Globo
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Orientação inicial: América do Sul e Diamantina voltadas para o visitante
    globeGroup.rotation.y = 1.35;
    globeGroup.rotation.x = 0.28;

    const GLOBE_RADIUS = 2.0;

    // Função utilitária: Converte Latitude e Longitude para Coordenadas 3D (Vector3)
    function latLonToVec3(lat, lon, radius) {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    }

    // 6. Esfera Base Branca Minimalista (Acabamento Fosco / Acetinado)
    const baseSphereGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const baseSphereMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,              // Branco acetinado sofisticado
      roughness: 0.35,              // Difusão suave da sombra 3D
      metalness: 0.05
    });
    const baseSphere = new THREE.Mesh(baseSphereGeometry, baseSphereMaterial);
    globeGroup.add(baseSphere);

    // 7. Grade Editorial de Paralelos e Meridianos (Graticule Sutil)
    const graticuleGroup = new THREE.Group();
    const ringMaterial = new THREE.LineBasicMaterial({
      color: 0xd4d4d8,
      transparent: true,
      opacity: 0.38
    });

    [-60, -30, 0, 30, 60].forEach((lat) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const r = GLOBE_RADIUS * Math.sin(phi);
      const y = GLOBE_RADIUS * Math.cos(phi);
      const circleGeo = new THREE.BufferGeometry();
      const points = [];
      const segments = 64;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta)));
      }
      circleGeo.setFromPoints(points);
      const ringLine = new THREE.Line(circleGeo, ringMaterial);
      graticuleGroup.add(ringLine);
    });
    globeGroup.add(graticuleGroup);

    // 8. Matriz de Pontos dos Continentes (Dotted Earth)
    // Com fallback procedimental defensivo caso globe-data.js demore para carregar
    function getLandCoordinates() {
      if (window.GLOBE_LAND_COORDS && Array.isArray(window.GLOBE_LAND_COORDS) && window.GLOBE_LAND_COORDS.length > 0) {
        return window.GLOBE_LAND_COORDS;
      }
      // Fallback procedural de alta densidade
      const fallback = [];
      for (let lat = -60; lat <= 70; lat += 2.5) {
        const step = 2.5 / Math.cos((lat * Math.PI) / 180);
        for (let lon = -180; lon < 180; lon += Math.max(step, 3)) {
          const isLand =
            (lon >= -125 && lon <= -35 && lat >= -55 && lat <= 65) || // Américas
            (lon >= -15 && lon <= 50 && lat >= -35 && lat <= 38) ||    // África
            (lon >= -10 && lon <= 145 && lat >= 10 && lat <= 70) ||   // Eurásia
            (lon >= 110 && lon <= 155 && lat >= -40 && lat <= -10);   // Oceania
          if (isLand && Math.sin(lat * 5) + Math.cos(lon * 5) > -0.6) {
            fallback.push([lat, lon]);
          }
        }
      }
      return fallback;
    }

    const landCoords = getLandCoordinates();
    const dotCount = landCoords.length;

    if (dotCount > 0) {
      const dotsGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(dotCount * 3);
      const dotRadius = GLOBE_RADIUS * 1.008;

      for (let i = 0; i < dotCount; i++) {
        const [lat, lon] = landCoords[i];
        const v = latLonToVec3(lat, lon, dotRadius);
        positions[i * 3] = v.x;
        positions[i * 3 + 1] = v.y;
        positions[i * 3 + 2] = v.z;
      }

      dotsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      // Material dos pontos em verde esmeralda vibrante
      const dotsMaterial = new THREE.PointsMaterial({
        color: 0x059669,
        size: 0.044,
        transparent: true,
        opacity: 0.96,
        blending: THREE.NormalBlending
      });

      const landDots = new THREE.Points(dotsGeometry, dotsMaterial);
      globeGroup.add(landDots);
    }

    // 9. Halo / Brilho de Atmosfera ao Redor do Globo
    // Correção GLSL: clamp() evita valores negativos passados para pow(), eliminando NaN em GPUs mobile
    const atmosphereGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.14, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float d = dot(vNormal, vec3(0.0, 0.0, 1.0));
          float intensity = pow(clamp(0.65 - d, 0.0, 1.0), 2.2);
          gl_FragColor = vec4(0.92, 0.96, 0.94, 1.0) * intensity * 0.7;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // 10. Cidade Principal: DIAMANTINA - MG (BRASIL)
    // Coordenadas geográficas reais: Latitude: -18.2439, Longitude: -43.6033
    const DIAMANTINA = {
      name: 'DIAMANTINA - MG',
      tag: '📍 HUB PRINCIPAL',
      lat: -18.2439,
      lon: -43.6033,
      isMain: true
    };

    // Cidades representando cada um dos continentes do planeta, conectadas a Diamantina
    const GLOBAL_CITIES = [
      { name: 'SÃO PAULO', tag: 'AMÉRICA DO SUL', lat: -23.5505, lon: -46.6333 },
      { name: 'NEW YORK', tag: 'AMÉRICA DO NORTE', lat: 40.7128, lon: -74.006 },
      { name: 'LONDRES', tag: 'EUROPA', lat: 51.5074, lon: -0.1278 },
      { name: 'TÓQUIO', tag: 'ÁSIA', lat: 35.6762, lon: 139.6503 },
      { name: 'CAIRO', tag: 'ÁFRICA', lat: 30.0444, lon: 31.2357 },
      { name: 'SYDNEY', tag: 'OCEANIA', lat: -33.8688, lon: 151.2093 },
      { name: 'ANTÁRTIDA', tag: 'POLO SUL', lat: -62.0844, lon: -58.3939 }
    ];

    // Criador de Badges / Rótulos em 3D (Sprites com CanvasTexture Otimizada)
    function createLocationBadge(title, subtitle, isMain = false) {
      const c = document.createElement('canvas');
      c.width = 440;
      c.height = 110;
      const ctx = c.getContext('2d');

      // Fundo em cápsula com estilo Glassmorphism
      ctx.fillStyle = isMain ? 'rgba(4, 38, 20, 0.94)' : 'rgba(14, 14, 14, 0.92)';
      ctx.strokeStyle = isMain ? '#10b981' : 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = isMain ? 4 : 2;

      // Desenha retângulo arredondado seguro
      const x = 6, y = 6, w = 428, h = 98, r = 24;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Ponto luminoso indicador
      ctx.beginPath();
      ctx.arc(isMain ? 34 : 38, 55, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = isMain ? '#34d399' : '#10b981';
      ctx.fill();

      // Texto Principal (Nome da Cidade)
      ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(title, 228, 48);

      // Subtítulo (Continente ou tag)
      ctx.font = '600 17px "JetBrains Mono", monospace';
      ctx.fillStyle = isMain ? '#34d399' : '#a3a3a3';
      ctx.fillText(subtitle, 228, 82);

      const texture = new THREE.CanvasTexture(c);
      texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;

      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false
      });

      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(isMain ? 1.35 : 1.15, isMain ? 0.34 : 0.29, 1);
      return sprite;
    }

    // Array de marcadores para fading ao girar para o verso da esfera
    const markersToTrack = [];

    // Adiciona o Marcador Principal de Diamantina
    const posDiamantina = latLonToVec3(DIAMANTINA.lat, DIAMANTINA.lon, GLOBE_RADIUS * 1.01);

    // Pin esférico brilhante
    const pinGeo = new THREE.SphereGeometry(0.045, 16, 16);
    const pinMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
    const pinMesh = new THREE.Mesh(pinGeo, pinMat);
    pinMesh.position.copy(posDiamantina);
    globeGroup.add(pinMesh);

    // Haste vertical de luz
    const stemEnd = latLonToVec3(DIAMANTINA.lat, DIAMANTINA.lon, GLOBE_RADIUS * 1.2);
    const stemGeo = new THREE.BufferGeometry().setFromPoints([posDiamantina, stemEnd]);
    const stemMat = new THREE.LineBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.85 });
    const stemLine = new THREE.Line(stemGeo, stemMat);
    globeGroup.add(stemLine);

    // Anéis pulsantes concêntricos em Diamantina
    const ringGeo = new THREE.RingGeometry(0.05, 0.09, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const pulseRing = new THREE.Mesh(ringGeo, ringMat);
    pulseRing.position.copy(posDiamantina);
    pulseRing.lookAt(new THREE.Vector3(0, 0, 0));
    globeGroup.add(pulseRing);

    // Badge informativo de Diamantina
    const badgeDiamantina = createLocationBadge(DIAMANTINA.name, DIAMANTINA.tag, true);
    badgeDiamantina.position.copy(latLonToVec3(DIAMANTINA.lat, DIAMANTINA.lon, GLOBE_RADIUS * 1.28));
    globeGroup.add(badgeDiamantina);

    markersToTrack.push({
      normalPos: posDiamantina,
      elements: [badgeDiamantina, pinMesh, stemLine, pulseRing]
    });

    // Grupo para Arcos de Conexão Globais
    const arcsGroup = new THREE.Group();
    globeGroup.add(arcsGroup);

    GLOBAL_CITIES.forEach((city) => {
      const posCity = latLonToVec3(city.lat, city.lon, GLOBE_RADIUS * 1.01);

      // Pin da cidade secundária
      const secPinGeo = new THREE.SphereGeometry(0.03, 12, 12);
      const secPinMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      const secPin = new THREE.Mesh(secPinGeo, secPinMat);
      secPin.position.copy(posCity);
      globeGroup.add(secPin);

      // Haste vertical
      const secStemEnd = latLonToVec3(city.lat, city.lon, GLOBE_RADIUS * 1.18);
      const secStemGeo = new THREE.BufferGeometry().setFromPoints([posCity, secStemEnd]);
      const secStemMat = new THREE.LineBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.65
      });
      const secStemLine = new THREE.Line(secStemGeo, secStemMat);
      globeGroup.add(secStemLine);

      // Badge secundário
      const secBadge = createLocationBadge(city.name, city.tag, false);
      secBadge.position.copy(latLonToVec3(city.lat, city.lon, GLOBE_RADIUS * 1.25));
      globeGroup.add(secBadge);

      markersToTrack.push({
        normalPos: posCity,
        elements: [secBadge, secPin, secStemLine]
      });

      // Arco Curvo conectando Diamantina à cidade
      let midPoint = new THREE.Vector3().addVectors(posDiamantina, posCity).multiplyScalar(0.5);

      if (midPoint.lengthSq() < 0.25) {
        let perp = new THREE.Vector3().crossVectors(posDiamantina, new THREE.Vector3(0, 1, 0));
        if (perp.lengthSq() < 0.05) {
          perp = new THREE.Vector3().crossVectors(posDiamantina, new THREE.Vector3(1, 0, 0));
        }
        perp.normalize().multiplyScalar(GLOBE_RADIUS * 0.9);
        midPoint.add(perp);
      }

      const dist = posDiamantina.distanceTo(posCity);
      const arcHeight = GLOBE_RADIUS * (1.18 + Math.min(dist, 3.8) * 0.12);
      midPoint.normalize().multiplyScalar(arcHeight);

      const curve = new THREE.QuadraticBezierCurve3(posDiamantina, midPoint, posCity);
      const curvePoints = curve.getPoints(50);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
      const arcMat = new THREE.LineBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.75
      });
      const arcLine = new THREE.Line(arcGeo, arcMat);
      arcsGroup.add(arcLine);
    });

    // 11. Interatividade do Usuário (Mouse, Touch Suave & Parallax)
    let isDragging = false;
    let previousPointerX = 0;
    let dragVelocityY = 0;

    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let currentParallaxX = 0;
    let currentParallaxY = 0;

    function onPointerDown(clientX) {
      isDragging = true;
      previousPointerX = clientX;
      dragVelocityY = 0;
    }

    function onPointerMove(clientX) {
      if (!isDragging) return;
      const deltaX = clientX - previousPointerX;
      previousPointerX = clientX;
      dragVelocityY = deltaX * 0.006;
      globeGroup.rotation.y += dragVelocityY;
    }

    function onPointerUp() {
      isDragging = false;
    }

    // Mouse Listeners
    container.addEventListener('mousedown', (e) => onPointerDown(e.clientX));
    window.addEventListener('mousemove', (e) => {
      onPointerMove(e.clientX);
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      targetParallaxX = (e.clientX - halfW) / halfW;
      targetParallaxY = (e.clientY - halfH) / halfH;
    });
    window.addEventListener('mouseup', onPointerUp);

    // Touch Listeners (Mobile Otimizado)
    container.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length === 1) {
          onPointerDown(e.touches[0].clientX);
        }
      },
      { passive: true }
    );

    window.addEventListener(
      'touchmove',
      (e) => {
        if (isDragging && e.touches.length === 1) {
          onPointerMove(e.touches[0].clientX);
        }
      },
      { passive: true }
    );

    window.addEventListener('touchend', onPointerUp, { passive: true });
    window.addEventListener('touchcancel', onPointerUp, { passive: true });

    // 12. Redimensionamento Responsivo & Otimização de Performance
    const handleResize = () => {
      if (!container || !renderer || !camera) return;

      const dims = getValidDimensions();
      width = dims.width;
      height = dims.height;

      // 1. Atualiza proporção da câmera
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      // 2. Ajuste de enquadramento da câmera conforme largura da tela
      if (width < 380) {
        camera.position.z = 6.6;
      } else if (width < 480) {
        camera.position.z = 6.2;
      } else if (width < 768) {
        camera.position.z = 5.9;
      } else {
        camera.position.z = 5.6;
      }

      // 3. Pixel ratio otimizado para mobile (evita travamentos em telas de alta densidade)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      // 4. Ajuste dimensional do WebGLRenderer
      renderer.setSize(width, height, false);

      // 5. Renderiza imediatamente no resize
      renderer.render(scene, camera);
    };

    // Listeners de Redimensionamento e Orientação
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });
    window.addEventListener('load', handleResize);

    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(container);
    }

    // Gatilhos em múltiplos passos para acomodar renderização lenta de fontes e CSS no GitHub Pages
    handleResize();
    requestAnimationFrame(handleResize);
    setTimeout(handleResize, 60);
    setTimeout(handleResize, 180);
    setTimeout(handleResize, 450);
    setTimeout(handleResize, 900);

    // 13. Relógio e Otimização com IntersectionObserver
    const clock = new THREE.Clock();
    let isVisible = true;
    let animationFrameId = null;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries || !entries.length) return;
          isVisible = entries[0].isIntersecting;
          if (isVisible && !animationFrameId) {
            clock.start();
            animate();
          } else if (!isVisible && animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
          }
        },
        { threshold: 0.05 }
      );
      observer.observe(container);
    }

    // 14. Loop Principal de Animação e Renderização (60 FPS)
    const worldNormal = new THREE.Vector3();
    const cameraDirection = new THREE.Vector3();

    function animate() {
      if (!isVisible) return;
      animationFrameId = requestAnimationFrame(animate);

      clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Suavização do Parallax e Inércia do Drag
      currentParallaxX += (targetParallaxX - currentParallaxX) * 0.05;
      currentParallaxY += (targetParallaxY - currentParallaxY) * 0.05;

      // Aplica rotação manual no eixo Y com amortecimento inercial suave
      globeGroup.rotation.y += dragVelocityY;
      dragVelocityY *= 0.92;

      // Auto-rotação contínua no eixo Y (pausada durante arraste ativo)
      if (!isDragging) {
        globeGroup.rotation.y += 0.003;
      }

      // Inclinação axial editorial fixa no eixo X
      globeGroup.rotation.x = 0.28;

      // Parallax sutil somado à posição da câmera
      camera.position.x = currentParallaxY * 0.7;
      camera.position.y = currentParallaxX * 0.7;
      camera.lookAt(0, 0, 0);

      // Animação de pulso do anel de Diamantina
      const pulseScale = 1.0 + Math.sin(elapsedTime * 3.5) * 0.45;
      pulseRing.scale.set(pulseScale, pulseScale, pulseScale);
      ringMat.opacity = 0.85 - (pulseScale - 0.55) * 0.5;

      // Oculta gradualmente os marcadores que giram para o lado oculto do globo
      camera.getWorldDirection(cameraDirection);

      markersToTrack.forEach((item) => {
        worldNormal.copy(item.normalPos).applyMatrix4(globeGroup.matrixWorld).normalize();
        const dot = worldNormal.dot(cameraDirection);

        if (dot < -0.12) {
          const fade = Math.min(1.0, (-dot - 0.12) * 3.5);
          item.elements.forEach((el) => {
            el.visible = true;
            if (el.material && el.material.opacity !== undefined) {
              el.material.opacity = fade * (el === badgeDiamantina ? 1.0 : 0.85);
            }
          });
        } else {
          item.elements.forEach((el) => {
            el.visible = false;
          });
        }
      });

      renderer.render(scene, camera);
    }

    // Renderiza o primeiro frame imediatamente para que a tela nunca fique preta
    clock.start();
    renderer.render(scene, camera);
    animate();
  }
})();
