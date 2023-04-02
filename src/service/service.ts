/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Queue from 'yocto-queue';
import { Graph, ItemRate, OutputNode, Node, Recipe, RecipeNode, Edge, Item, InputNode } from '../model/model';
import { timeMethod } from '../util/timing';
import { items, recipes, worldData } from './data';

export default class CalculatorService {
	public constructor() {
		console.log('CalculatorService created');
	}
	items: Map<string, Item> = items;
	inputItems: Set<Item> = new Set(worldData.maximums.keys());
	recipes: Recipe[] = recipes;
	bannedInputs: Set<Item> = new Set([
		items.get('mycelia')!,
		items.get('wood')!,
		items.get('leaves')!,
	]);
	bannedRecipes: Set<Recipe> = new Set(recipes.filter(r => new Set([
		'Unpackage Oil',
		'Unpackage Liquid Biofuel',
		'Unpackage Heavy Oil Residue',
		'Unpackage Fuel',

		//Test
	]).has(r.name)));
	pruneSuboptimal = true;

	public calculate(inputs: ItemRate[], outputs: ItemRate[], maxIterations = 1000): Graph {
		const graph = new Graph([]);
		const expandTime = timeMethod(() => this.expand(graph, inputs, outputs, maxIterations));
		const pruneTime = timeMethod(() => this.pruneUnfinishedChains(graph));
		const weightTime = timeMethod(() => this.calculateCost(graph));
		const simplifyTime = 0;//timeMethod(() => this.simplify(graph));

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

	private expand(graph: Graph, inputs: ItemRate[], outputs: ItemRate[], maxIterations = 1000): void {
		let iterations = 0;
		// breadth first (queue)
		const perimeter = new Queue<Node>();
		for (const output of outputs) {
			const opNode = new OutputNode(output);
			perimeter.enqueue(opNode);
			graph.nodes.push(opNode);
		}
		while (perimeter.size > 0 && iterations++ < maxIterations) {
			//console.log('Perimeter:\n   ', perimeter.map(n => n.friendlyName).join('\n    '));
			const node = perimeter.dequeue()!;
			console.log('Expanding node: ', node.friendlyName + ' (' + node.getDistanceToLeaf() + ')');

			if (node.getDistanceToLeaf() > 20) {
				console.error('Max depth reached!');
				continue;
			}
			if (node instanceof OutputNode) {
				const opNode = node as OutputNode;
				const recipesProducing = this.findRecipesProducing(opNode.item);
				if (recipesProducing.length !== 0) {
					console.log('Output - ' + opNode.item.item.name + ' -> ' + recipesProducing.map(r => r.recipe.name).join(', '));
					addRecipeNodes(recipesProducing, opNode, opNode.item);
				}
				if (!this.bannedInputs.has(opNode.item.item) && this.inputItems.has(opNode.item.item)) {
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
					}
					if (!this.bannedInputs.has(input.item) && this.inputItems.has(input.item)) {
						console.log(recipeNode.recipe.name + ' - ' + input.item.name + ' -> ' + 'Input node ' + input.item.name);
						addInputNodes(recipeNode, input);
					}
				}
			}
		}
		if (iterations >= maxIterations) {
			console.error('Max iterations reached!');
		}

		function addRecipeNodes(recipesProducing: RecipeNode[], outputNode: Node, item: ItemRate) {
			for (const recipeNode of recipesProducing) {
				graph.nodes.push(recipeNode);
				const edge = new Edge(recipeNode, outputNode, item);
				recipeNode.outgoingEdges.push(edge);
				outputNode.incomingEdges.push(edge);
				perimeter.enqueue(recipeNode);
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
			.filter(recipe => !this.bannedRecipes.has(recipe))
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
			if (iterations++ >= 100000) {
				console.error('Max iterations reached!');
				break;
			}
			const { cost, perimeter: newPerimeter, suboptimal } = this.expandNodeCost(node);
			node.cost = cost;
			newPerimeter.forEach(n => perimeter.enqueue(n));
			console.log('Calculated cost of ' + node.friendlyName + ' and it expands to ' + newPerimeter.map(n => n.friendlyName).join(', '));
			if (suboptimal.length > 0 && this.pruneSuboptimal) {
				console.log('Also deleted ' + suboptimal.map(e => e.source.friendlyName).join(', ') + ' because they are suboptimal');
				suboptimal.forEach(e => graph.deleteCascadingTowardsRoot(e.source));
			}
		}
		console.log(`Calculated edge costs in ${iterations} iterations`);
	}

	private expandNodeCost(node: Node): { cost: number, perimeter: Node[], suboptimal: Edge[] } {
		if (node instanceof InputNode) {
			const inputNode = node as InputNode;
			return {
				cost: worldData.calculateWP(inputNode.item),
				perimeter: inputNode.outgoingEdges.map(e => e.target),
				suboptimal: [],
			};
		} else if (node instanceof RecipeNode) {
			const recipeNode = node as RecipeNode;
			const satisfyingEdgeSubsets = generateSatisfyingEdgeSubsets(recipeNode);
			const bestEdgeSubset = selectBestEdgeSubset(satisfyingEdgeSubsets);
			return {
				cost: bestEdgeSubset.cost,
				perimeter: recipeNode.outgoingEdges.flatMap(e => e.target),
				suboptimal: node.incomingEdges.filter(e => !bestEdgeSubset.sub.includes(e)),
			};
		} else if (node instanceof OutputNode) {
			const satisfyingEdgeSubsets = node.incomingEdges.map(e => [e]);
			const bestEdgeSubset = selectBestEdgeSubset(satisfyingEdgeSubsets);
			return {
				cost: bestEdgeSubset.cost,
				perimeter: [],
				suboptimal: node.incomingEdges.filter(e => !bestEdgeSubset.sub.includes(e)),
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
			const parents = [...node.parents]; // create copy
			parents.forEach(parent => {
				prune2(parent);
			});
			if (node.isRoot) {
				if (node instanceof RecipeNode) {
					node.children.forEach(child => {
						child.removeParent(node);
					});
					toRemove.add(node);
				}
			} else {
				if (node instanceof RecipeNode && !node.isSatisfied()) {
					console.warn(node);
					node.children.forEach(child => {
						child.removeParent(node);
					});
					markForDeletionCascadingTowardsRoot(node);
				}
			}
		}

		function markForDeletionCascadingTowardsRoot(node: Node) {
			node.parents.forEach(parent => {
				markForDeletionCascadingTowardsRoot(parent);
			});
			toRemove.add(node);
		}
	}
}


