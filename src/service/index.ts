/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Queue from 'yocto-queue';
import { Graph, ItemRate, OutputNode, Node, Recipe, RecipeNode, Edge, Item, InputNode } from '../model';
import { timeMethod } from '../util/timing';
import { items, recipes, worldData } from './data';

export default class CalculatorService {
	public constructor() {
		console.log('CalculatorService created');
	}
	items: Map<string, Item> = items;
	recipes: Recipe[] = recipes;
	bannedIputs: Set<Item> = new Set([
		items.get('mycelia')!,
		items.get('wood')!,
		items.get('leaves')!,
		items.get('stone')!,
		items.get('coal')!,
		items.get('oreUranium')!,
		items.get('oreBauxite')!,
		items.get('sulfur')!,
	]);

	public calculate(inputs: ItemRate[], outputs: ItemRate[]): Graph {
		const graph = new Graph([]);
		const expandTime = timeMethod(() => this.expand(graph, inputs, outputs));
		const pruneTime = timeMethod(() => this.pruneUnfinishedChains(graph));
		const weightTime = timeMethod(() => this.calculateCost(graph));
		const simplifyTime = timeMethod(() => this.simplify(graph));

		console.log(`Created graph with ${graph.nodes.length} nodes
took 
    expand: ${expandTime}
	weight: ${weightTime}
	prune: ${pruneTime}
	simplify: ${simplifyTime}
	----
	${expandTime + pruneTime + simplifyTime + weightTime} ms
roots=[
	${graph.getRoots().map(n => n.friendlyName).join('\n    ')}
], 
leaves=[
	${graph.getLeaves().map(n => n.friendlyName).join('\n    ')}
]
intermediate=[
	${graph.nodes.filter(n => !n.isRoot && !n.isLeaf).map(n => n.friendlyName).join('\n    ')}
]`);
		console.log('Bad WP nodes: ', graph.nodes.filter(n => n instanceof InputNode).map(n => n as InputNode).filter(n => n.cost === undefined || n.cost === null || Number.isNaN(n.cost)).map(n => n.friendlyName).join('\n    '));

		return graph;
	}

	private expand(graph: Graph, inputs: ItemRate[], outputs: ItemRate[]): void {
		let iterations = 0;
		// can be breadth or depth first
		const perimeter: Node[] = [];
		for (const output of outputs) {
			const opNode = new OutputNode(output);
			perimeter.push(opNode);
			graph.nodes.push(opNode);
		}
		while (perimeter.length > 0 && iterations++ < 1000) {
			console.log('Perimeter:\n   ', perimeter.map(n => n.friendlyName).join('\n    '));
			const node = perimeter.pop()!;
			if (node.getDistanceToLeaf() > 10) {
				console.error('Max depth reached!');
				continue;
			}
			if (node instanceof OutputNode) {
				const opNode = node as OutputNode;
				const recipesProducing = this.findRecipesProducing(opNode.item);
				if (recipesProducing.length !== 0) {
					console.log('Output - ' + opNode.item.item.name + ' -> ' + recipesProducing.map(r => r.recipe.name).join(', '));
					addRecipeNodes(recipesProducing, opNode, opNode.item);
				} else {
					if (!this.bannedIputs.has(opNode.item.item)) {
						console.log('Output - ' + opNode.item.item.name + ' -> ' + 'Input node ' + opNode.item.item.name);
						addInputNodes(opNode, opNode.item);
					}
				}
			} else if (node instanceof RecipeNode) {
				const recipeNode = node as RecipeNode;
				for (const input of recipeNode.getScaledInputs()) {
					const recipesProducing = this.findRecipesProducing(input);
					if (recipesProducing.length !== 0) {
						console.log(recipeNode.recipe.name + ' - ' + input.item.name + ' -> ' + recipesProducing.map(r => r.recipe.name).join(', '));
						addRecipeNodes(recipesProducing, recipeNode, input);
					} else {
						if (!this.bannedIputs.has(input.item)) {
							console.log(recipeNode.recipe.name + ' - ' + input.item.name + ' -> ' + 'Input node ' + input.item.name);
							addInputNodes(recipeNode, input);
						}
					}
				}
			}
		}
		if (iterations >= 1000) {
			console.error('Max iterations reached!');
		}

		function addRecipeNodes(recipesProducing: RecipeNode[], outputNode: Node, item: ItemRate) {
			for (const recipeNode of recipesProducing) {
				graph.nodes.push(recipeNode);
				const edge = new Edge(recipeNode, outputNode, item);
				recipeNode.outgoingEdges.push(edge);
				outputNode.incomingEdges.push(edge);
				perimeter.push(recipeNode);
			}
		}

		function addInputNodes(outputNode: Node, item: ItemRate) {
			const inputNode = new InputNode(item);
			graph.nodes.push(inputNode);
			const edge = new Edge(inputNode, outputNode, item);
			inputNode.outgoingEdges.push(edge);
			outputNode.incomingEdges.push(edge);
		}
	}

	private findRecipesProducing(item: ItemRate): RecipeNode[] {
		return this.recipes
			.filter(recipe => recipe.outputs.some(output => output.item === item.item)) // TODO dictionary for caching
			.map(recipe => {
				const multiplier = item.rate / recipe.outputs.find(output => output.item === item.item)!.rate;
				return new RecipeNode(recipe, multiplier);
			});
	}

	private calculateCost(graph: Graph): void {
		console.log('Calculating edge costs');
		let iterations = 0;
		// should be breadth first (=queue)
		const perimeter = new Queue<Node>();
		const alreadySeen = new Set<Node>();
		graph.nodes.filter(n => n instanceof InputNode).forEach(n => perimeter.enqueue(n));
		for (const node of perimeter) {
			// Filters out nodes the dependencies of which have not been fully calculated yet
			if (node.incomingEdges.some(e => e.cost === undefined) || alreadySeen.has(node)) {
				continue;
			}
			alreadySeen.add(node);
			if (iterations++ >= 1000) {
				console.error('Max iterations reached!');
				break;
			}
			const { cost, perimeter: newPerimeter } = this.expandNodeCost(node);
			node.cost = cost;
			newPerimeter.forEach(n => perimeter.enqueue(n));
			console.log('Calculated cost of ' + node.friendlyName + ' and it expands to ' + newPerimeter.map(n => n.friendlyName).join(', '));
		}
		console.log(`Calculated edge costs in ${iterations} iterations`);
	}

	private expandNodeCost(node: Node): { cost: number, perimeter: Node[] } {
		if (node instanceof InputNode) {
			const inputNode = node as InputNode;
			return {
				cost: worldData.calculateWP(inputNode.item),
				perimeter: inputNode.outgoingEdges.map(e => e.target)
			};
		} else if (node instanceof RecipeNode) {
			// TODO: Implement pre-pruning of recipes that are too expensive
			const recipeNode = node as RecipeNode;
			const satisfyingEdgeSubsets = generateSatisfyingEdgeSubsets(recipeNode);
			const bestEdgeSubset = selectBestEdgeSubset(satisfyingEdgeSubsets);
			return {
				cost: bestEdgeSubset.cost,
				perimeter: recipeNode.outgoingEdges.flatMap(e => e.target)
			};
		} else if (node instanceof OutputNode) {
			// TODO: Implement pre-pruning of recipes that are too expensive
			const satisfyingEdgeSubsets = node.incomingEdges.map(e => [e]);
			const bestEdgeSubset = selectBestEdgeSubset(satisfyingEdgeSubsets);
			return {
				cost: bestEdgeSubset.cost,
				perimeter: []
			};
		}
		throw new Error('This should never happen');

		function generateSatisfyingEdgeSubsets(recipeNode: RecipeNode): Edge[][] {
			console.log(
				'Generating subsets for ' + recipeNode.recipe.name
				+ '(' + recipeNode.getScaledInputs().map(ir => ir.friendlyName).join(', ') + ')'
				+ ' from ' + recipeNode.incomingEdges.map(e => e.item.friendlyName).join(', '));
			const minimalSubsets = findMinimalSubsets(
				recipeNode.incomingEdges,
				edgeSet => recipeNode.isSatisfiedBy(ItemRate.simplify(edgeSet.map(e => e.item))));
			console.log('Generated subsets for ' + recipeNode.recipe.name + '(' + recipeNode.getScaledInputs().map(ir => ir.item.name + '*' + ir.rate) + ')' + ': ' + minimalSubsets.map(s => s.map(e => e.item.item.name + '*' + e.item.rate).join(', ')).join(' | '));
			return minimalSubsets;
		}

		function findMinimalSubsets(inputSet: Edge[], condition: (edgeSet: Edge[]) => boolean): Edge[][] {
			function backtrack(start: number, currentSubset: Edge[]) {
				if (condition(currentSubset)) {
					// check if the current subset is minimal
					let isMinimal = true;
					for (let i = 0; i < currentSubset.length; i++) {
						const subsetWithoutCurrent = currentSubset.slice(0, i).concat(currentSubset.slice(i + 1));
						if (condition(subsetWithoutCurrent)) {
							isMinimal = false;
							break;
						}
					}
					if (isMinimal) {
						minimalSubsets.push(currentSubset);
					}
					return;
				}
				for (let i = start; i < inputSet.length; i++) {
					const newSubset = currentSubset.concat(inputSet[i]);
					backtrack(i + 1, newSubset);
				}
			}
			const minimalSubsets: Edge[][] = [];
			backtrack(0, []);
			return minimalSubsets;
		}

		function selectBestEdgeSubset(subsets: Edge[][]): { cost: number, sub: Edge[] } {
			return subsets.reduce((bestSubset, currentSubset) => {
				const subCost = currentSubset.reduce((sum, curr) => sum + curr.cost!, 0); // This non-null assert should never fail
				return subCost < bestSubset.cost ? { cost: subCost, sub: currentSubset } : bestSubset;
			}, { cost: Number.MAX_VALUE, sub: [] as Edge[] });
		}
	}

	private pruneUnfinishedChains(graph: Graph): void {
		console.log('Pruning graph');
		const leaves = graph.nodes.filter(n => n.isLeaf);
		const toRemove = new Set<Node>();
		leaves.forEach(node => {
			prune2(node);
		});
		graph.nodes = graph.nodes.filter(n => !toRemove.has(n));
		console.log('Pruned ' + toRemove.size + ' nodes');


		function prune2(node: Node) {
			const parents = [...node.parents];
			parents.forEach(parent => {
				prune2(parent);
			});
			if (node.isRoot) {
				if (!(node instanceof InputNode)) {
					node.children.forEach(child => {
						child.removeParent(node);
					});
					toRemove.add(node);
				}
			}
		}
	}


	private simplify(graph: Graph): void {
		console.log('Simplifying graph');
	}
}

