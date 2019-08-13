import tinycolor from "tinycolor2";
// Brush colour and size
const colour = "#3d34a5";
const strokeWidth = 25;
const varyBrightness = 5;

// Drawing state
let latestPoint;
let drawing = false;
let currentAngle;

// Set up our drawing context
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

const varyColour = sourceColour => {
  const amount = Math.round(Math.random() * 2 * varyBrightness);
  const c = tinycolor(sourceColour);
  const varied =
    amount > varyBrightness
      ? c.brighten(amount - varyBrightness)
      : c.darken(amount);
  return varied.toHexString();
};

const makeBrush = size => {
  const brush = [];
  let bristleCount = Math.round(size / 3);
  const gap = strokeWidth / bristleCount;
  for (let i = 0; i < bristleCount; i++) {
    const distance =
      i === 0 ? 0 : gap * i + (Math.random() * gap) / 2 - gap / 2;
    brush.push({
      distance,
      thickness: Math.random() * 2 + 2,
      colour: varyColour(colour)
    });
  }
  return brush;
};

let currentBrush = makeBrush(strokeWidth);

// Geometry

const rotatePoint = (distance, angle, origin) => [
  origin[0] + distance * Math.cos(angle),
  origin[1] + distance * Math.sin(angle)
];

const getBearing = (origin, destination) =>
  (Math.atan2(destination[1] - origin[1], destination[0] - origin[0]) -
    Math.PI / 2) %
  (Math.PI * 2);

const getNewAngle = (origin, destination, oldAngle) => {
  const bearing = getBearing(origin, destination);
  if (typeof oldAngle === "undefined") {
    console.log(bearing);

    return bearing;
  }
  return oldAngle - angleDiff(oldAngle, bearing);
};

const angleDiff = (angleA, angleB) => {
  const twoPi = Math.PI * 2;
  const diff =
    ((angleA - (angleB > 0 ? angleB : angleB + twoPi) + Math.PI) % twoPi) -
    Math.PI;
  return diff < -Math.PI ? diff + twoPi : diff;
};

// Drawing functions

const strokeBristle = (origin, destination, bristle, controlPoint) => {
  context.beginPath();
  context.moveTo(origin[0], origin[1]);
  context.strokeStyle = bristle.colour;
  context.lineWidth = bristle.thickness;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.shadowColor = bristle.colour;
  context.shadowBlur = bristle.thickness / 2;
  context.quadraticCurveTo(
    controlPoint[0],
    controlPoint[1],
    destination[0],
    destination[1]
  );
  context.lineTo(destination[0], destination[1]);
  context.stroke();
};

const drawStroke = (bristles, origin, destination, oldAngle, newAngle) => {
  bristles.forEach(bristle => {
    context.beginPath();
    let bristleOrigin = rotatePoint(
      bristle.distance - strokeWidth / 2,
      oldAngle,
      origin
    );

    let bristleDestination = rotatePoint(
      bristle.distance - strokeWidth / 2,
      newAngle,
      destination
    );
    const controlPoint = rotatePoint(
      bristle.distance - strokeWidth / 2,
      newAngle,
      origin
    );
    bristleDestination = rotatePoint(
      bristle.distance - strokeWidth / 2,
      newAngle,
      destination
    );
    strokeBristle(bristleOrigin, bristleDestination, bristle, controlPoint);
  });
};
const continueStroke = newPoint => {
  const newAngle = getNewAngle(latestPoint, newPoint, currentAngle);
  drawStroke(currentBrush, latestPoint, newPoint, currentAngle, newAngle);
  currentAngle = newAngle % (Math.PI * 2);
  latestPoint = newPoint;
};
// Event helpers

const startStroke = point => {
    colour = document.getElementById("colourInput").value;
    currentAngle = undefined;
    currentBrush = makeBrush(strokeWidth);
    drawing = true;
    latestPoint = point;
};

const getTouchPoint = evt => {
  if (!evt.currentTarget) {
    return [0, 0];
  }
  const rect = evt.currentTarget.getBoundingClientRect();
  const touch = evt.targetTouches[0];
  console.log(rect, touch);
  return [touch.clientX - rect.left, touch.clientY - rect.top];
};

const BUTTON = 0b01;
const mouseButtonIsDown = buttons => (BUTTON & buttons) === BUTTON;

// Event handlers

const mouseMove = evt => {
  if (!drawing) {
    return;
  }
  continueStroke([evt.offsetX, evt.offsetY]);
};

const mouseDown = evt => {
  if (drawing) {
    return;
  }
  evt.preventDefault();
  canvas.addEventListener("mousemove", mouseMove, false);
  startStroke([evt.offsetX, evt.offsetY]);
};

const mouseEnter = evt => {
  if (!mouseButtonIsDown(evt.buttons) || drawing) {
    return;
  }
  mouseDown(evt);
};

const endStroke = evt => {
  if (!drawing) {
    return;
  }
  drawing = false;
  evt.currentTarget.removeEventListener("mousemove", mouseMove, false);
};

const touchStart = evt => {
  if (drawing) {
    return;
  }
  evt.preventDefault();
  startStroke(getTouchPoint(evt));
};

const touchMove = evt => {
  if (!drawing) {
    return;
  }
  continueStroke(getTouchPoint(evt));
};

const touchEnd = evt => {
  drawing = false;
};

// Register event handlers
canvas.addEventListener("touchstart", touchStart, false);
canvas.addEventListener("touchend", touchEnd, false);
canvas.addEventListener("touchcancel", touchEnd, false);
canvas.addEventListener("touchmove", touchMove, false);

canvas.addEventListener("mousedown", mouseDown, false);
canvas.addEventListener("mouseup", endStroke, false);
canvas.addEventListener("mouseout", endStroke, false);
canvas.addEventListener("mouseenter", mouseEnter, false);
