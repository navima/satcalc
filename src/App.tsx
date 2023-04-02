/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useEffect, useState } from 'react';
import './App.css';
import CalculatorService from './service';
import { Edge, Graph, InputNode, ItemRate, Node, OutputNode, RecipeNode } from './model';
import { GraphViz, Graph as VGraph, Node as VNode, Edge as VEdge } from './components/graph/GraphViz';

/**
 * Hashes a string. This is a non-cryptographic hash function.
 * 
 * {@see https://stackoverflow.com/a/52171480/9281022}
 * @param str the string to hash
 * @param seed (optional) seed value
 * @returns hash
 */
function hash(str: string, seed = 0) {
	let h1 = 0xdeadbeef ^ seed,
		h2 = 0x41c6ce57 ^ seed;
	for (let i = 0, ch; i < str.length; i++) {
		ch = str.charCodeAt(i);
		h1 = Math.imul(h1 ^ ch, 2654435761);
		h2 = Math.imul(h2 ^ ch, 1597334677);
	}

	h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
	h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

	return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

function renderNode(node: VNode<Node>) {
	const colorMap = {
		'default': '#F0F',
		'recipe': '#DDD',
		'input': '#D66',
		'output': '#0F0'
	};
	const width = 80;
	const height = 45;
	let color = colorMap['default'];
	let label = node.data.friendlyName;
	if (node.data instanceof RecipeNode) {
		color = colorMap['recipe'];
		label = node.data.recipe.name;
	} else if (node.data instanceof InputNode) {
		color = colorMap['input'];
		label = node.data.item.friendlyName;
	} else if (node.data instanceof OutputNode) {
		color = colorMap['output'];
		label = node.data.item.friendlyName;
	}
	return (
		<svg key={node.id}
			x={node.x - width / 2}
			y={node.y - height / 2}
			width={width}
			height={height}
		>
			<rect
				fill={color}
				width='100%'
				height='100%'>
			</rect>
			<foreignObject
				x='0'
				y='0'
				width='100%'
				height='100%'>
				<div
					style={{
						width: '100%',
						height: '100%',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						padding: 0,
						textAlign: 'center',
						verticalAlign: 'middle',
						fontFamily: 'sans-serif',
						fontSize: '15px',
						overflowWrap: 'break-word',
					}}>
					<div
						style={{
							overflowWrap: 'break-word',
						}}>
						{label}
					</div>
				</div>
			</foreignObject>
		</svg>
	);
}

function App() {
	const [calculatorService, setCalculatorService] = useState(() => new CalculatorService());

	const [item, setItem] = React.useState(calculatorService.items.get('ironPlateReinforced')!);
	const [amount, setAmount] = React.useState(60);
	const [itemInputValue, setItemInputValue] = React.useState(item.name);
	const [resultGraph, setResultGraph] = useState<Graph>();
	const [vizGraph, setVizGraph] = useState<VGraph<Node>>();

	useEffect(() => {
		setResultGraph(calculatorService.calculate([], [new ItemRate(item, amount)]));
	}, [item, amount]);

	useEffect(() => {
		if (resultGraph) {
			const nodes: VNode<Node>[] = resultGraph.nodes.map(node => ({
				id: '' + hash(node.friendlyName + node.children.map(c => c.friendlyName).join('')),
				label: node.friendlyName,
				x: 0,
				y: 0,
				width: 0,
				height: 0,
				incomingEdges: [],
				outgoingEdges: [],
				data: node,
			}));

			const nodesCache = new Map<string, VNode<Node>>();
			nodes.forEach(node => nodesCache.set(node.id, node));
			const edges: VEdge<Node>[] = Array.from(new Set<Edge>(resultGraph.nodes
				.flatMap(n => n.outgoingEdges)
				.concat(resultGraph.nodes.flatMap(n => n.incomingEdges))))
				.map(edge => ({
					from: nodesCache.get('' + hash(edge.source!.friendlyName + edge.source!.children.map(c => c.friendlyName).join('')))!,
					to: nodesCache.get('' + hash(edge.target!.friendlyName + edge.target!.children.map(c => c.friendlyName).join('')))!,
				}));
			edges.forEach(edge => {
				edge.from.outgoingEdges.push(edge);
				edge.to.incomingEdges.push(edge);
			});
			setVizGraph({
				nodes,
				edges: edges,
			});
		}
	}, [resultGraph]);

	return (
		<div>
			<input list='items' value={itemInputValue} onChange={(e) => {
				setItemInputValue(e.target.value);
				if (calculatorService.items.has(e.target.value)) {
					setItem(calculatorService.items.get(e.target.value)!);
				}
			}} />
			<input type='number' value={amount} onChange={(e) => setAmount(+e.target.value)} />
			<datalist id='items'>
				{Array.from(calculatorService.items.entries(), entry => (
					<option key={entry[0]} value={entry[0]}>{entry[1].name}</option>
				))}
			</datalist>
			<div>
				{vizGraph && <GraphViz graph={vizGraph} renderNode={renderNode} />}
			</div>
		</div>
	);
}

export default App;
