import React, { useRef, useEffect } from "react";

interface Props {
  reserveA: number;
  reserveB: number;
  amountToSwapA?: number;
  amountToSwapB?: number;
  width: number;
  height: number;
}

const Curve: React.FC<Props> = ({
  reserveA,
  reserveB,
  amountToSwapA = 0,
  amountToSwapB = 0,
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) => {
    const [dx, dy] = [x2 - x1, y2 - y1];
    const norm = Math.sqrt(dx * dx + dy * dy);
    const [udx, udy] = [dx / norm, dy / norm];
    const size = norm / 7;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - udx * size - udy * size,
      y2 - udy * size + udx * size
    ); // Flecha hacia atrás
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - udx * size + udy * size,
      y2 - udy * size - udx * size
    ); // Flecha hacia atrás
    ctx.stroke();
  };

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas && reserveA && reserveB) {
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      const textSize = 12;
      const widthCanvas = canvas.width;
      const heightCanvas = canvas.height;

      const reserveANum = Number(reserveA);
      const reserveBNum = Number(reserveB);

      if (reserveANum === 0 || reserveBNum === 0) return;

      const k = reserveANum * reserveBNum;

      const maxX = k / Math.max(reserveANum / 4, 1); // Evitar división por cero
      const minX = Math.max(k / (reserveANum * 10), 1); // Rango válido mínimo

      const maxY = (maxX * heightCanvas) / widthCanvas;
      const minY = (minX * heightCanvas) / widthCanvas;

      const plotX = (x: number) =>
        ((x - minX) / (maxX - minX)) * widthCanvas;
      const plotY = (y: number) =>
        heightCanvas - ((y - minY) / (maxY - minY)) * heightCanvas;

      ctx.clearRect(0, 0, widthCanvas, heightCanvas);

      ctx.strokeStyle = "#000000";
      ctx.fillStyle = "#000000";
      ctx.font = `${textSize}px Arial`;

      // Ejes
      ctx.beginPath();
      ctx.moveTo(plotX(minX), plotY(0));
      ctx.lineTo(plotX(minX), plotY(maxY));
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(plotX(0), plotY(minY));
      ctx.lineTo(plotX(maxX), plotY(minY));
      ctx.stroke();

      // Curva
      ctx.lineWidth = 2;
      ctx.beginPath();
      let first = true;
      for (let x = minX; x <= maxX; x += maxX / widthCanvas) {
        const y = k / x;
        if (first) {
          ctx.moveTo(plotX(x), plotY(y));
          first = false;
        } else {
          ctx.lineTo(plotX(x), plotY(y));
        }
      }
      ctx.stroke();
      ctx.lineWidth = 1;

      // Puntos destacados
      ctx.fillStyle = "#0000FF";
      ctx.beginPath();
      ctx.arc(plotX(reserveANum), plotY(reserveBNum), 5, 0, 2 * Math.PI);
      ctx.fill();

      // Indicadores de intercambio (Swap)
      if (amountToSwapA > 0) {
        const newReserveA = reserveANum + amountToSwapA;
        const newReserveB = k / newReserveA;

        ctx.fillStyle = "#bbbbbb";
        ctx.beginPath();
        ctx.arc(plotX(newReserveA), plotY(newReserveB), 5, 0, 2 * Math.PI);
        ctx.fill();

        // Flechas de intercambio
        ctx.strokeStyle = "#009900";
        drawArrow(
          ctx,
          plotX(reserveANum),
          plotY(reserveBNum),
          plotX(reserveANum),
          plotY(newReserveB)
        );
        drawArrow(
          ctx,
          plotX(reserveANum),
          plotY(newReserveB),
          plotX(newReserveA),
          plotY(newReserveB)
        );

        const amountGained =
          Math.round((10000 * (amountToSwapA * reserveBNum)) / newReserveA) /
          10000;
        ctx.fillStyle = "#000000";
        ctx.fillText(
          `${amountGained} TokenB output`,
          plotX(newReserveA) + textSize,
          plotY(newReserveB)
        );
      }

      if (amountToSwapB > 0) {
        const newReserveB = reserveBNum + amountToSwapB;
        const newReserveA = k / newReserveB;

        ctx.fillStyle = "#bbbbbb";
        ctx.beginPath();
        ctx.arc(plotX(newReserveA), plotY(newReserveB), 5, 0, 2 * Math.PI);
        ctx.fill();

        // Flechas de intercambio
        ctx.strokeStyle = "#009900";
        drawArrow(
          ctx,
          plotX(reserveANum),
          plotY(reserveBNum),
          plotX(newReserveA),
          plotY(reserveBNum)
        );
        drawArrow(
          ctx,
          plotX(newReserveA),
          plotY(reserveBNum),
          plotX(newReserveA),
          plotY(newReserveB)
        );

        const amountGained =
          Math.round((10000 * (amountToSwapB * reserveANum)) / newReserveB) /
          10000;
        ctx.fillStyle = "#000000";
        ctx.fillText(
          `${amountGained} TokenA output`,
          plotX(newReserveA) + textSize,
          plotY(newReserveB) - textSize
        );
      }
    }
  }, [reserveA, reserveB, amountToSwapA, amountToSwapB]);

  return (
    <div style={{ position: "relative", width, height }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ position: "absolute", left: 0, top: 0 }}
      />
      <div style={{ position: "absolute", left: "20%", bottom: -25 }}>
        -- TokenA Reserve --
      </div>
      <div
        style={{
          position: "absolute",
          left: -25,
          bottom: "20%",
          transform: "rotate(-90deg)",
          transformOrigin: "0 0",
        }}
      >
        -- TokenB Reserve --
      </div>
    </div>
  );
};

export default Curve;
