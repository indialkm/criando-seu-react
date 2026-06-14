import render from './render.js';

function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children: children.map(child =>
                typeof child === "object"
                    ? child
                    : createTextElement(child)
            ),
        },
    }
}

function createTextElement(text) {
    return {
        type: "TEXT_ELEMENT",
        props: {
            nodeValue: text,
            children: [],
        },
    }
}

const Didact = { createElement, render };

const element = Didact.createElement(
  "div",
  { style: "background: salmon; padding: 20px; border-radius: 8px;" },
  Didact.createElement("h1", null, "Mission 1: Success! 🎉"),
  Didact.createElement("p", null, "If you can see this, your DOM creation is working.")
);

const container = document.getElementById("root");
Didact.render(element, container);

let nextUnitOfWork = null
let wipRoot = null
function commitRoot() {}

function workLoop(deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot()
  }

  requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type)

  updateDom(dom, {}, fiber.props)
  return dom
}

function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }

  if (fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  reconcileChildren(fiber, fiber.props.children)
}

/* Let's simulate this tree:
      A
     / \
    B   D
   /
  C
*/

// 1. Create fake fibers
const fiberC = { type: "C", props: {} };
const fiberB = { type: "B", props: {}, child: fiberC };
const fiberD = { type: "D", props: {} };
const fiberA = { type: "A", props: {}, child: fiberB };

// 2. Link parents and siblings
fiberC.parent = fiberB;
fiberB.parent = fiberA;
fiberD.parent = fiberA;
fiberB.sibling = fiberD;

// 3. Temporarily mock the update function so it doesn't try to touch the DOM
const originalUpdateHost = updateHostComponent;
updateHostComponent = (fiber) => { 
  console.log("Visiting node:", fiber.type); 
};

// 4. Run your Work Loop logic manually
console.log("--- Starting Fiber Traversal Test ---");
let nextUnit = fiberA;
while (nextUnit) {
  nextUnit = performUnitOfWork(nextUnit);
}
console.log("--- Traversal Finished ---");

// Restore the original function for the next missions
updateHostComponent = originalUpdateHost;