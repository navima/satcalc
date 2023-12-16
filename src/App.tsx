/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useEffect, useState } from 'react';
import './App.css';
import CalculatorService from './service/service';
import { Edge, Graph, InputNode, ItemRate, Node, OutputNode, RecipeNode } from './model/model';
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

function renderNode(vizNode: VNode<Node>) {
	const node: Node = vizNode.data;
	const colorMap = {
		'default': '#F0F',
		'recipe': '#DDD',
		'input': '#D66',
		'output': '#0F0'
	};
	const width = 130;
	let height = 80;
	let color = colorMap['default'];
	let label = node.friendlyName;
	let inputs: ItemRate[] = [];
	let outputs: ItemRate[] = [];
	if (node instanceof RecipeNode) {
		const recipeNode = node as RecipeNode;
		color = colorMap['recipe'];
		label = recipeNode.multiplier.toFixed(2) + 'x ' + recipeNode.recipe.name;
		inputs = recipeNode.getScaledInputs();
		outputs = recipeNode.getScaledOutputs();
	} else if (node instanceof InputNode) {
		color = colorMap['input'];
		label = node.item.friendlyName;
		height = 30;
	} else if (node instanceof OutputNode) {
		color = colorMap['output'];
		label = node.item.friendlyName;
		height = 30;
	}
	if (node.cost === undefined) {
		color = '#F00';
	}
	return (
		<svg key={vizNode.id}
			x={vizNode.x - width / 2}
			y={vizNode.y - height / 2}
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
						flexDirection: 'column',
						justifyContent: 'center',
						alignItems: 'center',
						padding: 0,
						textAlign: 'center',
						verticalAlign: 'middle',
						fontFamily: 'sans-serif',
						fontSize: '10px',
						overflowWrap: 'break-word',
					}}>
					<div
						style={{
							overflowWrap: 'break-word',
						}}>
						{label}
					</div>
					<div>
						{node.cost?.toFixed(2)}
					</div>
					<table>
						<tbody>
							{inputs.map(item => (
								<tr key={item.item.name}>
									<td>IN</td>
									<td>{item.item.name}</td>
									<td>{item.rate.toFixed(2)}</td>
								</tr>
							))}
							{outputs.map(item => (
								<tr key={item.item.name}>
									<td>OUT</td>
									<td>{item.item.name}</td>
									<td>{item.rate.toFixed(2)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</foreignObject>
		</svg>
	);
}

function App() {
	const [calculatorService] = useState(() => new CalculatorService());
	const [item, setItem] = useState(calculatorService.items.get('ironPlate')!);
	const [amount, setAmount] = useState(60);
	const [itemInputValue, setItemInputValue] = React.useState(item.name);
	const [resultGraph, setResultGraph] = useState<Graph>();
	const [vizGraph, setVizGraph] = useState<VGraph<Node>>();
	const [maxIterations, setMaxIterations] = useState(1000);
	const [pruneSuboptimal, setPruneSuboptimal] = useState(true);

	useEffect(() => {
		calculatorService.pruneSuboptimal = pruneSuboptimal;
		setResultGraph(calculatorService.calculate([], [new ItemRate(item, amount)], maxIterations));
	}, [item, amount, maxIterations, pruneSuboptimal]);

	useEffect(() => {
		if (resultGraph) {
			const nodeMap = new Map<Node, VNode<Node>>();
			const nodes: VNode<Node>[] = resultGraph.nodes.map(node => {
				const vNode = {
					id: '',
					label: node.friendlyName,
					x: 0,
					y: 0,
					width: 0,
					height: 0,
					incomingEdges: [],
					outgoingEdges: [],
					data: node,
				};
				nodeMap.set(node, vNode);
				return vNode;
			});
			nodes.forEach(node => calculateHashRecursively(node, nodeMap));

			const edges: VEdge<Node>[] = Array.from(new Set<Edge>(resultGraph.nodes
				.flatMap(n => n.outgoingEdges)
				.concat(resultGraph.nodes.flatMap(n => n.incomingEdges))))
				.map(edge => ({
					from: nodeMap.get(edge.source)!,
					to: nodeMap.get(edge.target)!,
					label: edge.item.friendlyName,
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
		// node is unambiguously defined by its name and its parents (outputs)
		function calculateHashRecursively(node: VNode<Node>, nodeMap: Map<Node, VNode<Node>>): void {
			if (node.id === '') {
				if (node.data.isLeaf) {
					node.id = node.data.friendlyName;
				} else {
					const childNodes = node.data.children.map(child => nodeMap.get(child)!);
					childNodes.forEach(node => calculateHashRecursively(node!, nodeMap));
					node.id = node.data.friendlyName + childNodes.map(node => node?.id).join(' ');
				}
			}
		}
	}, [resultGraph]);

	return (
		<div>
			<label htmlFor='item'>Item</label>
			<input id='item' list='items' value={itemInputValue} onChange={(e) => {
				setItemInputValue(e.target.value);
				if (calculatorService.items.has(e.target.value)) {
					setItem(calculatorService.items.get(e.target.value)!);
				}
			}} />
			<label htmlFor='amount'>Amount</label>
			<input id='amount' type='number' value={amount} onChange={(e) => setAmount(+e.target.value)} />
			<label htmlFor='maxIterations'>Max Iterations</label>
			<input id='maxIterations' type='number' value={maxIterations} onChange={e => setMaxIterations(+e.target.value)} />
			<label htmlFor='pruneSuboptimal'>Prune Suboptimal</label>
			<input id='pruneSuboptimal' type='checkbox' checked={pruneSuboptimal} onChange={e => setPruneSuboptimal(e.target.checked)} />
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
