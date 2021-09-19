export interface GraphNode<T> {
  value: T;
  siblings: Set<GraphNode<T>>;
}

export const attach = <T>(nodeA: GraphNode<T>, nodeB: GraphNode<T>) => {
  if (!nodeA.siblings.has(nodeB) || !nodeB.siblings.has(nodeA)) {
    nodeA.siblings.add(nodeB);
    nodeB.siblings.add(nodeA);
  }
};

export const detach = <T>(nodeA: GraphNode<T>, nodeB: GraphNode<T>) => {
  if (nodeA.siblings.has(nodeB) || nodeB.siblings.has(nodeA)) {
    nodeA.siblings.delete(nodeB);
    nodeB.siblings.delete(nodeA);
  }
};

export type GraphWalker<T> = (value: T, distance: number) => void;

export const walkDepthFirst = <T>(root: GraphNode<T>, walker: GraphWalker<T>) =>
  walkDepthFirstRecursive(root, walker, 0, new Set());

const walkDepthFirstRecursive = <T>(
  node: GraphNode<T>,
  walker: GraphWalker<T>,
  depth: number,
  visited: Set<GraphNode<T>>
) => {
  if (!node || visited.has(node)) {
    return;
  }
  walker(node.value, depth);
  visited.add(node);
  node.siblings.forEach((sibling) =>
    walkDepthFirstRecursive(sibling, walker, depth + 1, visited)
  );
};

export const walkBreadthFirst = <T>(
  root: GraphNode<T>,
  walker: GraphWalker<T>
) => {
  const queue: GraphNode<T>[] = [];
  queue.push(root);

  const visited = new Set<GraphNode<T>>();
  let it = 0;
  while (queue.length) {
    const node = queue.shift();
    if (!node || visited.has(node)) {
      continue;
    }
    walker(node.value, it++);
    visited.add(node);
    node.siblings.forEach((sibling) => queue.push(sibling));
  }
};
