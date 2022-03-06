import { Plugin, doc, Doc } from "prettier";
import { Parser } from "node-sql-parser";

export const languages: Plugin["languages"] = [
	{
		name: "SQL",
		parsers: ["sql"],
	},
];

const parser = new Parser();

export const parsers: Plugin["parsers"] = {
	sql: {
		parse(text) {
			return parser.astify(text);
		},
		astFormat: "sql",
		locStart() {
			return 0;
		},
		locEnd() {
			return 0;
		},
	},
};

const { join, group, ifBreak, indent, softline, line } = doc.builders;

interface FromInitial {
	db: null | string;
	table: string;
	as: string;
	join: undefined;
}

interface FromJoin extends Omit<FromInitial, "join"> {
	join: string;
	on: any;
}

type From = FromInitial | FromJoin;

function print(node: any): Doc {
	if (node.type === "column_ref") {
		return join(".", [node.table, node.column]);
	}

	if (node.type === "single_quote_string") {
		return ['"', node.value, '"'];
	}

	if (node.type === "binary_expr") {
		return group([
			print(node.left),
			" ",
			node.operator,
			" ",
			print(node.right),
		]);
	}

	if (node.type === "select") {
		return group([
			join(" ", ["select", node.columns]),
			softline,
			...node.from.map((from: From) => {
				if (from.join) {
					const on = join(" ", ["on", print(from.on)]);

					return [
						group([
							join(" ", [
								from.join === "INNER JOIN" ? "join" : from.join.toLowerCase(),
								from.db ? `\`${from.db}\`.${from.table}` : from.table,
								from.as,
								ifBreak(indent(on), on),
							]),
						]),
						softline,
					];
				}

				return [
					group([
						join(" ", [
							"from",
							from.db ? `\`${from.db}\`.${from.table}` : from.table,
							from.as,
						]),
					]),
					softline,
				];
			}),
			join(" ", ["where", print(node.where)]),
			";",
			line,
		]);
	}

	return " ";
}

export const printers: Plugin["printers"] = {
	sql: {
		print(path) {
			const node = path.getValue();

			return print(node);
		},
	},
};
