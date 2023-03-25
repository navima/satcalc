/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Item, Recipe, ItemRate } from '../model';

export const items: Map<string, Item> = new Map<string, Item>([
	['ironOre', new Item('Iron ore')],
	['ironIngot', new Item('Iron ingot')],
	['ironPlate', new Item('Iron plate')],
	['reinforcedIronPlate', new Item('Reinforced iron plate')],
	['screw', new Item('Screw')],
	['ironRod', new Item('Iron rod')],
	['water', new Item('Water')]
]);
export const recipes: Recipe[] = [
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
		name: 'Reinforced Iron Plate',
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
		name: 'Iron Plate',
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
		name: 'Iron Rod',
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
		name: 'Iron Ingot',
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
