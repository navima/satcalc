/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Item, Recipe, ItemRate } from '../model';

export const items: Map<string, Item> = new Map<string, Item>([
	['ironOre', new Item('Iron ore')],
	['copperOre', new Item('Copper ore')],
	['ironIngot', new Item('Iron ingot')],
	['ironPlate', new Item('Iron plate')],
	['reinforcedIronPlate', new Item('Reinforced iron plate')],
	['screw', new Item('Screw')],
	['ironRod', new Item('Iron rod')],
	['water', new Item('Water')]
]);
export const recipes: Recipe[] = [
	new Recipe(
		'Iron alloy ingot',
		'foundry',
		[
			new ItemRate(items.get('ironOre')!, 20),
			new ItemRate(items.get('copperOre')!, 20)
		],
		[
			new ItemRate(items.get('ironIngot')!, 50)
		]
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
		]),
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