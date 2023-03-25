/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Item, Recipe, ItemRate } from '../model';

export const items: Map<string, Item> = new Map<string, Item>([
	['water', new Item('Water')],
	['oil', new Item('Oil')],

	['ironOre', new Item('Iron ore')],
	['copperOre', new Item('Copper ore')],
	['cateriumOre', new Item('Caterium ore')],
	['limestone', new Item('Limestone')],
	['coal', new Item('Coal')],
	['sulfur', new Item('Sulfur')],
	['quartz', new Item('Quartz')],
	['bauxite', new Item('Bauxite')],
	['uranium', new Item('Uranium')],

	['ironIngot', new Item('Iron ingot')],
	['copperIngot', new Item('Copper ingot')],
	['cateriumIngot', new Item('Caterium ingot')],

	['plastic', new Item('Plastic')],
	['heavyOil', new Item('Heavy oil residue')],
	['wire', new Item('Wire')],
	['ironPlate', new Item('Iron plate')],
	['reinforcedIronPlate', new Item('Reinforced iron plate')],
	['screw', new Item('Screw')],
	['ironRod', new Item('Iron rod')],
]);
export const recipes: Recipe[] = [
	new Recipe(
		'Plastic',
		'refinery',
		[new ItemRate(items.get('oil')!, 30)],
		[new ItemRate(items.get('plastic')!, 20), new ItemRate(items.get('heavyOil')!, 10)]
	),
	new Recipe(
		'Coated iron plate',
		'assembler',
		[
			new ItemRate(items.get('ironIngot')!, 50),
			new ItemRate(items.get('plastic')!, 10)
		],
		[new ItemRate(items.get('ironPlate')!, 75)]
	),
	new Recipe(
		'Copper ingot',
		'smelter',
		[new ItemRate(items.get('copperOre')!, 30)],
		[new ItemRate(items.get('copperIngot')!, 30)]
	),
	new Recipe(
		'Wire',
		'constructor',
		[new ItemRate(items.get('copperIngot')!, 1)],
		[new ItemRate(items.get('wire')!, 2)]
	),
	new Recipe(
		'Stitced iron plate',
		'assembler',
		[
			new ItemRate(items.get('ironPlate')!, 18.75),
			new ItemRate(items.get('wire')!, 37.5)
		],
		[
			new ItemRate(items.get('reinforcedIronPlate')!, 5.625)
		],
		true
	),
	new Recipe(
		'Iron alloy ingot',
		'foundry',
		[
			new ItemRate(items.get('ironOre')!, 20),
			new ItemRate(items.get('copperOre')!, 20)
		],
		[
			new ItemRate(items.get('ironIngot')!, 50)
		],
		true
	),
	new Recipe(
		'Pure iron ingot',
		'refinery',
		[
			new ItemRate(items.get('ironOre')!, 35),
			new ItemRate(items.get('water')!, 20)
		],
		[
			new ItemRate(items.get('ironIngot')!, 65)
		],
		true),
	{
		name: 'Reinforced iron plate',
		machine: 'assembler',
		alt: false,
		inputs: [
			{ item: items.get('ironPlate')!, rate: 30 },
			{ item: items.get('screw')!, rate: 60 }
		],
		outputs: [
			{ item: items.get('reinforcedIronPlate')!, rate: 5 }
		]
	},
	{
		name: 'Iron plate',
		machine: 'constructor',
		alt: false,
		inputs: [
			{ item: items.get('ironIngot')!, rate: 30 }
		],
		outputs: [
			{ item: items.get('ironPlate')!, rate: 20 }
		]
	},
	{
		name: 'Screw',
		machine: 'constructor',
		alt: false,
		inputs: [
			{ item: items.get('ironRod')!, rate: 10 }
		],
		outputs: [
			{ item: items.get('screw')!, rate: 40 }
		]
	},
	{
		name: 'Iron rod',
		machine: 'constructor',
		alt: false,
		inputs: [
			{ item: items.get('ironIngot')!, rate: 15 }
		],
		outputs: [
			{ item: items.get('ironRod')!, rate: 15 }
		]
	},
	{
		name: 'Iron ingot',
		machine: 'smelter',
		alt: false,
		inputs: [
			{ item: items.get('ironOre')!, rate: 30 }
		],
		outputs: [
			{ item: items.get('ironIngot')!, rate: 30 }
		]
	}
];
export const worldData = {
	maximums: new Map<Item, number>([
		[items.get('water')!, Infinity],
		[items.get('oil')!, 11_700],

		[items.get('ironOre')!, 70_380],
		[items.get('copperOre')!, 28_860],
		[items.get('cateriumOre')!, 11_040],
		[items.get('limestone')!, 52_860],
		[items.get('coal')!, 30_120],
		[items.get('sulfur')!, 6_840],
		[items.get('quartz')!, 10_500],
		[items.get('bauxite')!, 9_780],
		[items.get('uranium')!, 2_100],
	]),
	calculateWP: (item: ItemRate): number => {
		return item.rate / worldData.maximums.get(item.item)! * 10_000;
	}
};

function validate() {
	validateItems();
	validateRecipes();
}

function validateItems() {
	for (const [key, item] of items.entries()) {
		validatePascalCase(key);
		validatePrettyName(item.name);
	}
}

function validateRecipes() {
	for (const recipe of recipes) {
		validatePrettyName(recipe.name);
		// TODO validateMachine(recipe.machine);
		for (const input of recipe.inputs) {
			validateItemRate(input);
		}
		for (const output of recipe.outputs) {
			validateItemRate(output);
		}
	}
}

function validateItemRate(itemRate: ItemRate) {
	if (itemRate.item === undefined) {
		console.error(`Invalid item: ${itemRate.item} in itemRate: `, itemRate);
	}
	if (!Array.from(items.values()).includes(itemRate.item)) {
		console.error(`Invalid item: ${itemRate.item.name} in itemRate: `, itemRate);
	}
	if (itemRate.rate <= 0) {
		console.error(`Invalid rate: ${itemRate.rate} in itemRate: `, itemRate);
	}
}

function validatePascalCase(s: string) {
	if (s === undefined || !s.match(/[a-z][a-zA-Z]*/)) {
		throw new Error(`Invalid name: ${s}`);
	}
}

function validatePrettyName(s: string) {
	if (s === undefined || !s.match(/^[A-Z][a-z]*(?: [a-z]*)*$/)) {
		throw new Error(`Invalid display name: ${s}. \n Display names should be in the form \`Foo bar baz\` or \`Foo\`.`);
	}
}

validate();