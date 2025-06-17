const HexagonRow = () => {
    const createRoundedHexPath = (cx, cy, size, cornerRadius = 4) => {
      const angle = Math.PI / 3;
      const points = [];
  
      for (let i = 0; i < 6; i++) {
        const theta = i * angle;
        const x = cx + size * Math.cos(theta);
        const y = cy + size * Math.sin(theta);
        points.push({ x, y });
      }
  
      let d = '';
      for (let i = 0; i < 6; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % 6];
  
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const offsetX = (dx / len) * cornerRadius;
        const offsetY = (dy / len) * cornerRadius;
  
        const startX = p1.x + offsetX;
        const startY = p1.y + offsetY;
        const endX = p2.x - offsetX;
        const endY = p2.y - offsetY;
  
        if (i === 0) {
          d += `M ${startX} ${startY} `;
        } else {
          d += `L ${startX} ${startY} `;
        }
  
        d += `Q ${p2.x} ${p2.y} ${endX} ${endY} `;
      }
  
      d += 'Z';
      return d;
    };
  
    const hexagons = [
      { size: 14, cx: 24, id: 'grad1' },
      { size: 11, cx: 35, id: 'grad2' },
      { size: 9,  cx: 43, id: 'grad3' },
    ];
  
    return (
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#66ccff" />
            <stop offset="100%" stopColor="#0033cc" />
          </linearGradient>
          <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3399ff" />
            <stop offset="100%" stopColor="#0022aa" />
          </linearGradient>
          <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0066ff" />
            <stop offset="100%" stopColor="#001188" />
          </linearGradient>
        </defs>
  
        {hexagons.map(({ size, cx, id }, i) => (
          <path
            key={i}
            d={createRoundedHexPath(cx, 40, size)}
            fill="none"
            stroke={`url(#${id})`}
            strokeWidth="2"
          />
        ))}
      </svg>
    );
  };
  
  export default HexagonRow;
  