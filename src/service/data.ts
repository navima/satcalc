/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Item, Recipe, ItemRate } from '../model';
import recipesJson from '../resources/recipes.json';

export const items: Map<string, Item> = new Map<string, Item>([
	// Resources
	//  Liquid
	['water', new Item('Water')],
	['oil', new Item('Oil')],

	//  Solid
	['ironOre', new Item('Iron ore')],
	['copperOre', new Item('Copper ore')],
	['cateriumOre', new Item('Caterium ore')],
	['limestone', new Item('Limestone')],
	['coal', new Item('Coal')],
	['sulfur', new Item('Sulfur')],
	['quartz', new Item('Quartz')],
	['bauxite', new Item('Bauxite')],
	['uranium', new Item('Uranium')],
	['compactedCoal', new Item('Compacted coal')],

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
	['copperSheet', new Item('Copper sheet')],
	['circuitBoard', new Item('Circuit board')],
	['motor', new Item('Motor')],
	['concrete', new Item('Concrete')],
	['packagedNitrogenGas', new Item('Packaged nitrogen gas')],
	['nitrogenGas', new Item('Nitrogen gas')],
	['rubber', new Item('Rubber')],
	['emptyFluidTank', new Item('Empty fluid tank')],
	['nitricAcid', new Item('Nitric acid')],
	['aluminumCasing', new Item('Aluminum casing')],
	['steelIngot', new Item('Steel ingot')],
	['nitrogenGas', new Item('Nitrogen gas')],
	['fuel', new Item('Fuel')],
	['turbofuel', new Item('Turbofuel')],
	['fineBlackPowder', new Item('Fine black powder')],
	['heatSink', new Item('Heat sink')],
	['coolingSystem', new Item('Cooling system')],
	['heavyModularFrame', new Item('Heavy modular frame')],
	['fusedModularFrame', new Item('Fused modular frame')],
	['compactedCoal', new Item('Compacted coal')],
	['heavyOil', new Item('Heavy oil residue')],
]);
export const recipes: Recipe[] = [
	new Recipe(
		'Unpackage nitrogen gas',
		'packager',
		[new ItemRate(items.get('packagedNitrogenGas')!, 60)],
		[new ItemRate(items.get('nitrogenGas')!, 240), new ItemRate(items.get('emptyFluidTank')!, 60)]
	),
	new Recipe(
		'Cooling system',
		'Blender',
		[
			new ItemRate(items.get('heatSink')!, 12),
			new ItemRate(items.get('rubber')!, 12),
			new ItemRate(items.get('water')!, 30),
			new ItemRate(items.get('nitrogenGas')!, 150)
		],
		[new ItemRate(items.get('coolingSystem')!, 6)]
	),
	new Recipe(
		'Fused modular frame',
		'Blender',
		[
			new ItemRate(items.get('heavyModularFrame')!, 1.5),
			new ItemRate(items.get('aluminumCasing')!, 75),
			new ItemRate(items.get('nitrogenGas')!, 37.5),
		],
		[new ItemRate(items.get('fusedModularFrame')!, 1.5)]
	),
	new Recipe(
		'Nitric acid',
		'Blender',
		[
			new ItemRate(items.get('nitrogenGas')!, 120),
			new ItemRate(items.get('water')!, 30),
			new ItemRate(items.get('ironPlate')!, 10)
		],
		[new ItemRate(items.get('nitricAcid')!, 30)]
	),
	new Recipe(
		'Packaged nitrogen gas',
		'packager',
		[new ItemRate(items.get('nitrogenGas')!, 240), new ItemRate(items.get('emptyFluidTank')!, 60)],
		[new ItemRate(items.get('packagedNitrogenGas')!, 60)]
	),
	new Recipe(
		'Cooling device',
		'Blender',
		[
			new ItemRate(items.get('heatSink')!, 9.375),
			new ItemRate(items.get('motor')!, 1.875),
			new ItemRate(items.get('nitrogenGas')!, 45)
		],
		[new ItemRate(items.get('coolingSystem')!, 3.75)],
		true
	),
	new Recipe(
		'Turbofuel',
		'refinery',
		[new ItemRate(items.get('fuel')!, 22.5), new ItemRate(items.get('compactedCoal')!, 15)],
		[new ItemRate(items.get('turbofuel')!, 18.75)]),
	new Recipe(
		'Fine black powder',
		'assembler',
		[new ItemRate(items.get('compactedCoal')!, 3.75), new ItemRate(items.get('sulfur')!, 7.5)],
		[new ItemRate(items.get('fineBlackPowder')!, 15)],
		true),
	new Recipe(
		'Compacted steel ingot',
		'foundry',
		[new ItemRate(items.get('ironOre')!, 22.5), new ItemRate(items.get('compactedCoal')!, 11.25)],
		[new ItemRate(items.get('steelIngot')!, 37.5)],
		true
	),
	new Recipe(
		'Turbo heavy oil',
		'refinery',
		[new ItemRate(items.get('heavyOil')!, 37.5), new ItemRate(items.get('compactedCoal')!, 30)],
		[new ItemRate(items.get('turbofuel')!, 30)],
		true
	),
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
			new ItemRate(items.get('ironPlate')!, 30),
			new ItemRate(items.get('screw')!, 60)
		],
		outputs: [
			new ItemRate(items.get('reinforcedIronPlate')!, 5)
		]
	},
	{
		name: 'Iron plate',
		machine: 'constructor',
		alt: false,
		inputs: [
			new ItemRate(items.get('ironIngot')!, 30)
		],
		outputs: [
			new ItemRate(items.get('ironPlate')!, 20)
		]
	},
	{
		name: 'Screw',
		machine: 'constructor',
		alt: false,
		inputs: [
			new ItemRate(items.get('ironRod')!, 10)
		],
		outputs: [
			new ItemRate(items.get('screw')!, 40)
		]
	},
	{
		name: 'Iron rod',
		machine: 'constructor',
		alt: false,
		inputs: [
			new ItemRate(items.get('ironIngot')!, 15)
		],
		outputs: [
			new ItemRate(items.get('ironRod')!, 15)
		]
	},
	{
		name: 'Iron ingot',
		machine: 'smelter',
		alt: false,
		inputs: [
			new ItemRate(items.get('ironOre')!, 30)
		],
		outputs: [
			new ItemRate(items.get('ironIngot')!, 30)
		]
	}
];
export const worldData = {
	maximums: new Map<Item, number>([
		[items.get('water')!, Infinity],
		[items.get('oil')!, 11_700],

		[items.get('nitrogenGas')!, 12_000],

		[items.get('ironOre')!, 70_380],
		[items.get('copperOre')!, 28_860],
		[items.get('oreGold')!, 11_040],
		[items.get('limestone')!, 52_860],
		[items.get('coal')!, 30_120],
		[items.get('sulfur')!, 6_840],
		[items.get('quartz')!, 10_500],
		[items.get('oreBauxite')!, 9_780],
		[items.get('uranium')!, 2_100],
		[items.get('samOre')!, 5_400],
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

function readRecipes() {
	items.clear();
	recipes.length = 0;
	for (const key in recipesJson) {
		const recipe = recipesJson[key as keyof typeof recipesJson];
		const recipeItems = recipe.input.concat(recipe.output).map(input => input.name);
		for (const item of recipeItems)
			if (!items.has(item))
				items.set(item, new Item(item));

		recipes.push(new Recipe(
			recipe.name,
			recipe.machine[0],
			recipe.input.map(input => new ItemRate(items.get(input.name)!, input.rate)),
			recipe.output.filter(op => op.name !== 'water').map(output => new ItemRate(items.get(output.name)!, output.rate)),
			recipe.alt
		));
	}
	worldData.maximums = new Map<Item, number>([
		[items.get('water')!, Infinity],
		[items.get('oil')!, 11_700],

		[items.get('nitrogenGas')!, 12_000],

		[items.get('oreIron')!, 70_380],
		[items.get('oreCopper')!, 28_860],
		[items.get('oreGold')!, 11_040],
		[items.get('stone')!, 52_860],
		[items.get('coal')!, 30_120],
		[items.get('sulfur')!, 6_840],
		[items.get('rawQuartz')!, 10_500],
		[items.get('oreBauxite')!, 9_780],
		[items.get('oreUranium')!, 2_100],
		[items.get('samOre')!, 5_400],
		[items.get('wood')!, 0],
		[items.get('mycelia')!, 0],
		[items.get('leaves')!, 0],
	]);
}

// no need to validate generated json
//validate();
readRecipes();
