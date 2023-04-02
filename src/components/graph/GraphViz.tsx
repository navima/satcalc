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
	label: string;
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

class VizService<T> {
	public graph: Graph<T>;
	private renderNode: (node: Node<T>) => ReactElement;
	constructor(graph: Graph<T>, nodeFunction: (node: Node<T>) => ReactElement) {
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
					<>
						<line
							key={edge.from.id + edge.to.id}
							x1={edge.from.x}
							y1={edge.from.y}
							x2={edge.to.x}
							y2={edge.to.y}
							stroke='black' />
						<path
							key={edge.from.id + edge.to.id + 'path'}
							d={`M${edge.to.x},${edge.to.y} L${edge.from.x},${edge.from.y}`} id={edge.from.id + edge.to.id} fill='none' />
						<text 
							key={edge.from.id + edge.to.id + 'text'}
							fontSize={11}
							textAnchor='middle'
							dy={-2}>
							<textPath href={'#' + edge.from.id + edge.to.id} startOffset='50%'>
								{edge.label}
							</textPath>
						</text>
					</>
				))
				.concat(renderedNodes));
	}

	private topologicalSort(nodes: Node<T>[]): Node<T>[] {
		const inDegree = new Map(nodes.map(node => [node, node.incomingEdges.length]));

		const queue = new Queue<Node<T>>();
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

	private layoutDAG(nodes: Node<T>[]) {
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

	private sortASAP(nodes: Node<T>[]): Node<T>[][] {
		const queue = new Queue<[number, Node<T>]>();
		// start with leaves
		nodes
			.filter(node => node.outgoingEdges.length === 0)
			.forEach(node => queue.enqueue([0, node]));
		const order: Node<T>[][] = [];
		const seen = new Set<Node<T>>();
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

	private layoutASAP(nodes: Node<T>[]) {
		const order = this.sortASAP(nodes);
		for (const [layerIndex, layerNodes] of order.entries()) {
			//let lastNodeRight = 0; // TODO: use this to prevent overlap
			for (const [index, node] of layerNodes.entries()) {
				node.x = index * 150;
				node.y = layerIndex * 150;
			}
		}
		this.graph.nodes.forEach(node => {
			node.x += 75;
			node.y += 75;
		});
	}
}

export function GraphViz<T>(props: GraphVizProps<T>): ReactElement {
	const { graph, renderNode } = props;
	const [vizService, setVizService] = useState(() => new VizService(graph, renderNode ?? ((node: Node<unknown>) => <text key={node.id} x={node.x} y={node.y}>{node.label}</text>)));
	const [elements, setElements] = useState<ReactElement[]>([]);

	useEffect(() => {
		vizService.graph = graph;
		vizService.layout();
		setElements(vizService.render());
		console.log('laid out ' + graph.nodes.length + ' nodes' + ' and ' + graph.edges.length + ' edges');
	}, [graph]);

	return (
		<div>
			{graph.nodes.length} nodes, {graph.edges.length} edges
			<svg height={3000} width={3000}>
				{elements}
			</svg>
		</div>
	);
}
