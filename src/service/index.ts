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

	public calculate(inputs: ItemRate[], outputs: ItemRate[]): Graph {
		const graph = new Graph([]);
		const expandTime = timeMethod(() => this.expand(graph, inputs, outputs));
		const weightTime = timeMethod(() => this.calculateCost(graph));
		const pruneTime = timeMethod(() => this.prune(graph));
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
			if (node.getDistanceToLeaf() > 15) {
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
					console.log('Output - ' + opNode.item.item.name + ' -> ' + 'Input node ' + opNode.item.item.name);
					addInputNodes(opNode, opNode.item);
				}
			} else if (node instanceof RecipeNode) {
				const recipeNode = node as RecipeNode;
				for (const input of recipeNode.getScaledInputs()) {
					const recipesProducing = this.findRecipesProducing(input);
					if (recipesProducing.length !== 0) {
						console.log(recipeNode.recipe.name + ' - ' + input.item.name + ' -> ' + recipesProducing.map(r => r.recipe.name).join(', '));
						addRecipeNodes(recipesProducing, recipeNode, input);
					} else {
						console.log(recipeNode.recipe.name + ' - ' + input.item.name + ' -> ' + 'Input node ' + input.item.name);
						addInputNodes(recipeNode, input);
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
			// TODO: actually implement this instead of just returning the superset
			return [recipeNode.incomingEdges];
		}

		function selectBestEdgeSubset(subsets: Edge[][]): { cost: number, sub: Edge[] } {
			return subsets.reduce((bestSubset, currentSubset) => {
				const subCost = currentSubset.reduce((sum, curr) => sum + curr.cost!, 0); // This non-null assert should never fail
				return subCost < bestSubset.cost ? { cost: subCost, sub: currentSubset } : bestSubset;
			}, { cost: Number.MAX_VALUE, sub: [] as Edge[] });
		}
	}

	private prune(graph: Graph): void {
		console.log('Pruning graph');
	}


	private simplify(graph: Graph): void {
		console.log('Simplifying graph');
	}
}


