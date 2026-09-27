/**
 * HERO 3D SCENE - WANDRY PORTFOLIO
 * Globo Terrestre Interativo com Matriz de Pontos (Dotted Earth Globe)
 * Destaque especial na cidade de Diamantina - MG (Brasil)
 * Arcos de conexão, balões informativos (badges), auto-rotação e parallax
 * Desenvolvido com Three.js e otimizado para 60 FPS
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', initHeroGlobe);

  function initHeroGlobe() {
    const container = document.getElementById('hero-canvas-container');
    const canvas = document.getElementById('hero-3d-canvas');

    if (!container || !canvas || typeof THREE === 'undefined') {
      console.warn('Three.js ou elementos do Hero Globe não encontrados.');
      return;
    }

    // 1. Dimensões
    let width = container.clientWidth;
    let height = container.clientHeight;

    // 2. Cena & Câmera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.8);

    // 3. Renderizador WebGL
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // 4. Grupo Raiz do Globo (permite rotação global e controle de posição)
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

    // 5. Esfera Base Branca Minimalista (Acabamento Fosco / Acetinado)
    const baseSphereGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const baseSphereMaterial = new THREE.MeshStandardMaterial({
      color: 0xfafafa,              // Branco puro sofisticado
      roughness: 0.35,              // Difusão suave da sombra 3D
      metalness: 0.05
    });
    const baseSphere = new THREE.Mesh(baseSphereGeometry, baseSphereMaterial);
    globeGroup.add(baseSphere);

    // 6. Grade Editorial de Paralelos e Meridianos (Graticule Sutil em Cinza)
    const graticuleGroup = new THREE.Group();
    const ringMaterial = new THREE.LineBasicMaterial({
      color: 0xd4d4d8,
      transparent: true,
      opacity: 0.4
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

    // 7. Matriz de Pontos dos Continentes (Dotted Matrix Earth - Grafite Escuro)
    const landCoords = window.GLOBE_LAND_COORDS || [];
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

      // Material de pontos dos países em verde esmeralda sobre o globo branco
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

    // 8. Halo / Brilho de Atmosfera ao Redor do Globo Branco
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
          float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 2.2);
          gl_FragColor = vec4(0.92, 0.95, 0.93, 1.0) * intensity * 0.7;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // 9. Cidade Principal: DIAMANTINA - MG (BRASIL)
    // Coordenadas reais: Latitude: -18.2439, Longitude: -43.6033
    const DIAMANTINA = {
      name: 'DIAMANTINA - MG',
      tag: '📍 HUB PRINCIPAL',
      lat: -18.2439,
      lon: -43.6033,
      isMain: true
    };

    // Cidades secundárias para conexão global (como na imagem de referência)
    const GLOBAL_CITIES = [
      { name: 'SÃO PAULO', tag: 'BRASIL', lat: -23.5505, lon: -46.6333 },
      { name: 'NEW YORK', tag: 'USA', lat: 40.7128, lon: -74.006 },
      { name: 'LONDON', tag: 'UK', lat: 51.5074, lon: -0.1278 }
    ];

    // Criador de Badges / Rótulos em 3D (Sprites de Alta Resolução)
    function createLocationBadge(title, subtitle, isMain = false) {
      const c = document.createElement('canvas');
      c.width = 380;
      c.height = 110;
      const ctx = c.getContext('2d');

      // Fundo em cápsula com estilo Glassmorphism
      ctx.fillStyle = isMain ? 'rgba(4, 38, 20, 0.94)' : 'rgba(14, 14, 14, 0.9)';
      ctx.strokeStyle = isMain ? '#10b981' : 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = isMain ? 4 : 2;

      // Desenha retângulo arredondado seguro
      const x = 6, y = 6, w = 368, h = 98, r = 24;
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

      // Texto Principal
      ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(title, 190, 50);

      // Subtítulo
      ctx.font = '600 20px "JetBrains Mono", monospace';
      ctx.fillStyle = isMain ? '#34d399' : '#a3a3a3';
      ctx.fillText(subtitle, 190, 84);

      const texture = new THREE.CanvasTexture(c);
      texture.minFilter = THREE.LinearFilter;
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false
      });

      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(isMain ? 1.35 : 1.15, isMain ? 0.39 : 0.33, 1);
      return sprite;
    }

    // Array de marcadores para atualização de visibilidade (fading ao girar pro lado oposto)
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
    const stemMat = new THREE.LineBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.8 });
    const stemLine = new THREE.Line(stemGeo, stemMat);
    globeGroup.add(stemLine);

    // Anel pulsante de radar em Diamantina
    const ringGeo = new THREE.RingGeometry(0.04, 0.12, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const pulseRing = new THREE.Mesh(ringGeo, ringMat);
    pulseRing.position.copy(posDiamantina);
    pulseRing.lookAt(posDiamantina.clone().multiplyScalar(2));
    globeGroup.add(pulseRing);

    // Badge de Diamantina
    const badgeDiamantina = createLocationBadge(DIAMANTINA.name, DIAMANTINA.tag, true);
    badgeDiamantina.position.copy(latLonToVec3(DIAMANTINA.lat, DIAMANTINA.lon, GLOBE_RADIUS * 1.32));
    globeGroup.add(badgeDiamantina);

    markersToTrack.push({
      normalPos: posDiamantina,
      elements: [badgeDiamantina, pinMesh, stemLine, pulseRing]
    });

    // Adiciona Cidades Globais e Arcos de Conexão
    const arcsGroup = new THREE.Group();
    globeGroup.add(arcsGroup);

    GLOBAL_CITIES.forEach((city) => {
      const posCity = latLonToVec3(city.lat, city.lon, GLOBE_RADIUS * 1.01);

      // Pin secundário
      const secPinGeo = new THREE.SphereGeometry(0.03, 12, 12);
      const secPinMat = new THREE.MeshBasicMaterial({ color: 0x059669 });
      const secPin = new THREE.Mesh(secPinGeo, secPinMat);
      secPin.position.copy(posCity);
      globeGroup.add(secPin);

      // Badge secundário
      const secBadge = createLocationBadge(city.name, city.tag, false);
      secBadge.position.copy(latLonToVec3(city.lat, city.lon, GLOBE_RADIUS * 1.25));
      globeGroup.add(secBadge);

      markersToTrack.push({
        normalPos: posCity,
        elements: [secBadge, secPin]
      });

      // Arco Curvo conectando Diamantina à cidade global
      const midPoint = new THREE.Vector3().addVectors(posDiamantina, posCity).multiplyScalar(0.5);
      const dist = posDiamantina.distanceTo(posCity);
      const arcHeight = GLOBE_RADIUS * (1.18 + dist * 0.12);
      midPoint.normalize().multiplyScalar(arcHeight);

      const curve = new THREE.QuadraticBezierCurve3(posDiamantina, midPoint, posCity);
      const curvePoints = curve.getPoints(45);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
      const arcMat = new THREE.LineBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.85
      });
      const arcLine = new THREE.Line(arcGeo, arcMat);
      arcsGroup.add(arcLine);
    });

    // 10. Iluminação para o Globo Branco
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(5, 5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf1f5f9, 0.9);
    fillLight.position.set(-5, -2, 2);
    scene.add(fillLight);

    // Rim light esmeralda sutil na borda oposta
    const rimLight = new THREE.DirectionalLight(0x10b981, 0.5);
    rimLight.position.set(-3, -4, -3);
    scene.add(rimLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    // 11. Interatividade do Usuário (Mouse, Touch, Drag com Inércia e Parallax)
    let mouseX = 0;
    let mouseY = 0;
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let currentParallaxX = 0;
    let currentParallaxY = 0;

    let isDragging = false;
    let previousPointer = { x: 0, y: 0 };
    let dragVelocityY = 0;

    function onMouseMove(e) {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      targetParallaxY = Math.max(-1.2, Math.min(1.2, nx)) * 0.45;
      targetParallaxX = -Math.max(-1.2, Math.min(1.2, ny)) * 0.35;
    }

    function onPointerDown(e) {
      isDragging = true;
      const pageX = e.touches ? e.touches[0].clientX : e.clientX;
      const pageY = e.touches ? e.touches[0].clientY : e.clientY;
      previousPointer = { x: pageX, y: pageY };
    }

    function onPointerMove(e) {
      const pageX = e.touches ? e.touches[0].clientX : e.clientX;
      const pageY = e.touches ? e.touches[0].clientY : e.clientY;

      if (isDragging) {
        const deltaX = pageX - previousPointer.x;
        // Rotação precisa e fluida no eixo Y
        dragVelocityY += deltaX * 0.0075;

        previousPointer = { x: pageX, y: pageY };
      } else {
        onMouseMove(e);
      }
    }

    function onPointerUp() {
      isDragging = false;
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    container.addEventListener('mousedown', onPointerDown, { passive: true });
    window.addEventListener('mouseup', onPointerUp, { passive: true });

    container.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp, { passive: true });

    // 12. Redimensionamento Responsivo
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;

      if (width === 0 || height === 0) return;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      if (width < 450) {
        camera.position.z = 6.6;
      } else {
        camera.position.z = 5.8;
      }

      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    handleResize();

    // 13. Relógio e Otimização com IntersectionObserver
    const clock = new THREE.Clock();
    let isVisible = true;
    let animationFrameId = null;

    const observer = new IntersectionObserver(
      (entries) => {
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

    // 14. Loop Principal de Animação e Renderização (60 FPS)
    const worldNormal = new THREE.Vector3();
    const cameraDirection = new THREE.Vector3();

    function animate() {
      if (!isVisible) return;
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Suavização do Parallax e Inércia do Drag
      currentParallaxX += (targetParallaxX - currentParallaxX) * 0.05;
      currentParallaxY += (targetParallaxY - currentParallaxY) * 0.05;

      // Aplica rotação manual no eixo Y com amortecimento inercial suave
      globeGroup.rotation.y += dragVelocityY;
      dragVelocityY *= 0.92;

      // Auto-rotação contínua no eixo Y (pausada durante arraste ativo para controle total)
      if (!isDragging) {
        globeGroup.rotation.y += 0.003;
      }

      // Mantém a inclinação axial elegante fixa no eixo X
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
        // Converte o ponto do marcador para coordenadas globais
        worldNormal.copy(item.normalPos).applyMatrix4(globeGroup.matrixWorld).normalize();

        // Produto escalar entre a normal da cidade e a direção da visão
        const dot = worldNormal.dot(cameraDirection);

        // Se dot < -0.15, o ponto está voltado para a frente da câmera
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

    animate();
  }
})();
