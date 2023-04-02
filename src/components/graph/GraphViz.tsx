import React, { ReactElement, useEffect, useState } from 'react';
import Queue from 'yocto-queue';

export interface Node<T> {
	id: string;
	label: string;
	x: number;
	y: number;
	width: number;
	height: number;
	data: T;
	incomingEdges: Edge<T>[];
	outgoingEdges: Edge<T>[];
}

export interface Edge<T> {
	from: Node<T>;
	to: Node<T>;
}

export interface Graph<T> {
	nodes: Node<T>[];
	edges: Edge<T>[];
}

export interface GraphVizProps<T> {
	graph: Graph<T>;
	renderNode?: (node: Node<T>) => ReactElement;
}

class VizService {
	private graph: Graph<any>;
	private renderNode: (node: Node<any>) => ReactElement;
	constructor(graph: Graph<any>, nodeFunction: (node: Node<any>) => ReactElement) {
		this.graph = graph;
		this.renderNode = nodeFunction;
	}

	public layout(): void {
		/*this.graph.nodes.forEach((node, i) => {
			node.x = 100 * (i % 8);
			node.y = 100 * Math.floor(i / 8);
		});*/
		//this.layoutDAG(this.graph.nodes);
		this.layoutASAP(this.graph.nodes);
	}

	public render(): ReactElement[] {
		const renderedNodes = this.graph.nodes.map(node => this.renderNode(node));
		return (
			this.graph.edges
				.map(edge => (
					<line key={edge.from.id + edge.to.id} x1={edge.from.x} y1={edge.from.y} x2={edge.to.x} y2={edge.to.y} stroke='black' />
				))
				.concat(renderedNodes));
	}

	private topologicalSort(nodes: Node<any>[]): Node<any>[] {
		const inDegree = new Map(nodes.map(node => [node, node.incomingEdges.length]));

		const queue = new Queue<Node<any>>();
		nodes
			.filter(node => node.incomingEdges.length === 0)
			.forEach(node => queue.enqueue(node));

		const order = [];

		for (const node of queue) {
			order.push(node);

			for (const child of node.outgoingEdges.map(edge => edge.to) ?? []) {
				inDegree.set(child, (inDegree.get(child) ?? 0) - 1);

				if (inDegree.get(child) === 0) {
					queue.enqueue(child);
				}
			}
		}
		return order;
	}

	private layoutDAG(nodes: Node<any>[]) {
		const order = this.topologicalSort(nodes);
		const rowPopulation: number[] = [];

		for (const node of order) {
			let x = 0;
			let y = 0;

			for (const parent of node.incomingEdges.map(edge => edge.from)) {
				const px = parent.x;
				const py = parent.y;
				// x is the rightmost parent
				x = Math.max(x, px);
				// y is the lowest parent + 1
				y = Math.max(y, py + 1);
			}

			node.x = x == 0 ? (rowPopulation[y] ?? 0) : x;
			node.y = y;
			rowPopulation[y] = (rowPopulation[y] ?? 0) + 1;
			console.log(node);
		}

		for (const node of nodes) {
			node.x *= 30;
			node.y *= 30;
			node.x += 30;
			node.y += 30;
		}
	}

	private sortASAP(nodes: Node<any>[]): Node<any>[][] {
		const queue = new Queue<[number, Node<any>]>();
		// start with leaves
		nodes
			.filter(node => node.outgoingEdges.length === 0)
			.forEach(node => queue.enqueue([0, node]));
		const order: Node<any>[][] = [];
		const seen = new Set<Node<any>>();
		for (const [layer, node] of queue) {
			if (seen.has(node)) continue; else seen.add(node);

			if (!order[layer]) order[layer] = [];
			order[layer].push(node);
			for (const parent of node.incomingEdges.map(edge => edge.from)) {
				queue.enqueue([layer + 1, parent]);
			}
		}
		return order;
	}

	private layoutASAP(nodes: Node<any>[]) {
		const order = this.sortASAP(nodes);
		for (const [layerIndex, layerNodes] of order.entries()) {
			//let lastNodeRight = 0;
			for (const [index, node] of layerNodes.entries()) {
				const renderedNode = this.renderNode(node);
				node.x = index * 100;
				node.y = layerIndex * 60;
			}
		}
		this.graph.nodes.forEach(node => {
			node.x += 50;
			node.y += 50;
		});
	}
}

export const GraphViz = (props: GraphVizProps<any>) => {
	const { graph, renderNode } = props;
	const [vizService, setVizService] = useState(() => new VizService(graph, renderNode ?? ((node: Node<any>) => <text key={node.id} x={node.x} y={node.y}>{node.label}</text>)));
	const [elements, setElements] = useState<ReactElement[]>([]);

	useEffect(() => {
		vizService.layout();
		setElements(vizService.render());
		console.log('laid out ' + graph.nodes.length + ' nodes' + ' and ' + graph.edges.length + ' edges');
	}, [graph]);

	return (
		<div>
			{graph.nodes.length} nodes, {graph.edges.length} edges
			<svg height={800} width={800}>
				{elements}
			</svg>
			<svg height={800} width={800}>
				{elements}
			</svg>
		</div>
	);
};