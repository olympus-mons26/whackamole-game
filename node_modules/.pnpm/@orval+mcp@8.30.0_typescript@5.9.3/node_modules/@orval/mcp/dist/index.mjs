import path from "node:path";
import { GetterPropType, camel, conventionName, generateMutatorImports, getFileInfo, getFullRoute, getKey, getParamsInPath, getPropertyAccessor, isObject, isString, jsDoc, jsStringEscape, pascal, upath } from "@orval/core";
import { generateClient, generateFetchHeader } from "@orval/fetch";
import { generateZod, getZodImportSource } from "@orval/zod";
//#region src/index.ts
const getZodSchemaImportStatement = (variant) => `import * as zod from '${getZodImportSource(variant)}';`;
const getHeader = (option, info) => {
	if (!option) return "";
	const header = option(info);
	return Array.isArray(header) ? jsDoc({ description: header }) : header;
};
const getAnnotations = (verb) => {
	switch (verb) {
		case "get":
		case "head":
		case "options": return "{ readOnlyHint: true }";
		case "query": return "{ readOnlyHint: true, idempotentHint: true }";
		case "post":
		case "patch": return "{ destructiveHint: true }";
		case "put":
		case "delete": return "{ destructiveHint: true, idempotentHint: true }";
		default: return "";
	}
};
const getSpecInfo = (context) => context.spec.info ?? {
	title: "API",
	version: "1.0.0"
};
const getMcpTargetInfo = (output, info) => getFileInfo(output.target, {
	backupFilename: conventionName(info.title ?? "filename", output.namingConvention),
	extension: output.fileExtension
});
const getMcpHeader = ({ verbOptions, output }) => {
	const targetInfo = getFileInfo(output.target);
	const schemasPath = isObject(output.schemas) ? output.schemas.path : isString(output.schemas) ? output.schemas : void 0;
	const schemaInfo = schemasPath ? getFileInfo(schemasPath) : void 0;
	const isZodSchemaOutput = isObject(output.schemas) && output.schemas.type === "zod";
	const basePath = schemaInfo?.dirname;
	const relativeSchemaImportPath = basePath ? isZodSchemaOutput && output.indexFiles ? upath.getRelativeImportPath(targetInfo.path, basePath, true) : upath.getRelativeImportPath(targetInfo.path, basePath) : "./" + targetInfo.filename + ".schemas";
	const importSchemaNames = new Set(Object.values(verbOptions).flatMap((verbOption) => {
		const imports = [];
		const pascalOperationName = pascal(verbOption.typeName);
		if (verbOption.queryParams) imports.push(`${pascalOperationName}Params`);
		if (verbOption.body.imports[0]?.name) imports.push(verbOption.body.imports[0]?.name);
		return imports;
	})).values().toArray();
	const importSchemasImplementation = schemasPath ? `import type {\n  ${importSchemaNames.join(",\n  ")}\n} from '${relativeSchemaImportPath}';
` : "";
	const httpClientPath = path.join(targetInfo.dirname, `http-client${output.fileExtension}`);
	const relativeFetchClientPath = upath.getRelativeImportPath(targetInfo.path, httpClientPath);
	return [importSchemasImplementation, `import {\n  ${new Set(Object.values(verbOptions).flatMap((verbOption) => verbOption.operationName)).values().toArray().join(",\n  ")}\n} from '${relativeFetchClientPath}';
  `].join("\n") + "\n";
};
const generateMcp = (verbOptions) => {
	const handlerArgsTypes = [];
	const originalParamNames = getParamsInPath(verbOptions.pathRoute);
	const pathParamsType = verbOptions.params.map((param, index) => {
		const paramName = originalParamNames[index];
		const paramType = param.implementation.split(": ")[1];
		return `    ${getKey(paramName)}: ${paramType}`;
	}).join(",\n");
	if (pathParamsType) handlerArgsTypes.push(`  pathParams: {\n${pathParamsType}\n  };`);
	if (verbOptions.queryParams) handlerArgsTypes.push(`  queryParams: ${verbOptions.queryParams.schema.name};`);
	if (verbOptions.body.definition) handlerArgsTypes.push(`  bodyParams${verbOptions.body.isOptional ? "?" : ""}: ${verbOptions.body.definition};`);
	const handlerArgsName = `${verbOptions.operationName}Args`;
	const handlerArgsImplementation = handlerArgsTypes.length > 0 ? `
export type ${handlerArgsName} = {
${handlerArgsTypes.join("\n")}
}
` : "";
	const fetchParams = [];
	if (verbOptions.params.length > 0) {
		const pathParamsArgs = originalParamNames.map((paramName) => `args.pathParams${getPropertyAccessor(paramName)}`).join(", ");
		fetchParams.push(pathParamsArgs);
	}
	for (const prop of verbOptions.props) if (prop.type === GetterPropType.BODY) fetchParams.push("args.bodyParams");
	else if (prop.type === GetterPropType.QUERY_PARAM) fetchParams.push("args.queryParams");
	const handlersImplementation = [handlerArgsImplementation, `
export const ${`${verbOptions.operationName}Handler`} = async (${handlerArgsTypes.length > 0 ? `args: ${handlerArgsName}, ` : ""}options?: RequestInit) => {
  const res = await ${verbOptions.operationName}(${fetchParams.length > 0 ? `${fetchParams.join(", ")}, ` : ""}options);

  if (res.status >= 400) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(res.data ?? null),
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(res.data ?? null),
      },
    ],
    structuredContent: res.data,
  };
};`].join("");
	return {
		implementation: handlersImplementation ? `${handlersImplementation}\n` : "",
		imports: []
	};
};
const generateServer = (verbOptions, output, context) => {
	const info = getSpecInfo(context);
	const { path: targetPath, extension, dirname } = getMcpTargetInfo(output, info);
	const serverPath = path.join(dirname, `server${extension}`);
	const header = getHeader(output.override.header, info);
	const mcpServerOptions = output.override.mcp.server;
	const hasResponseSchema = output.override.zod.generate.response && !output.override.zod.generateEachHttpStatus;
	const toolImplementations = Object.values(verbOptions).map((verbOption) => {
		const pascalOperationName = pascal(verbOption.typeName);
		const inputSchemaTypes = [];
		if (verbOption.params.length > 0) inputSchemaTypes.push(`pathParams: ${pascalOperationName}Params`);
		if (verbOption.queryParams) inputSchemaTypes.push(`queryParams: ${pascalOperationName}QueryParams`);
		if (verbOption.body.definition) inputSchemaTypes.push(`bodyParams: ${pascalOperationName}Body${verbOption.body.isOptional ? ".optional()" : ""}`);
		const inputSchemaImplementation = inputSchemaTypes.length > 0 ? `\n    inputSchema: {\n      ${inputSchemaTypes.join(",\n      ")}\n    },` : "";
		const outputSchemaImplementation = hasResponseSchema ? `\n    outputSchema: ${pascalOperationName}Response,` : "";
		const annotationsValue = getAnnotations(verbOption.verb);
		const annotationsImplementation = annotationsValue ? `\n    annotations: ${annotationsValue},` : "";
		const titleImplementation = verbOption.summary ? `\n    title: '${jsStringEscape(verbOption.summary)}',` : "";
		const operationDescription = verbOption.originalOperation.description;
		const descriptionValue = (operationDescription && operationDescription.length > 0 ? operationDescription : verbOption.summary) ?? "";
		const descriptionImplementation = descriptionValue ? `\n    description: '${jsStringEscape(descriptionValue)}',` : "";
		const requestInitWithSignal = `{
    ...options,
    signal: options?.signal ? AbortSignal.any([options.signal, ctx.signal]) : ctx.signal,
  }`;
		const handlerCallImplementation = inputSchemaTypes.length > 0 ? `(args, ctx) => ${verbOption.operationName}Handler(args, ${requestInitWithSignal})` : `(ctx) => ${verbOption.operationName}Handler(${requestInitWithSignal})`;
		return `
tools.${verbOption.operationName} = server.registerTool(
  '${jsStringEscape(verbOption.operationName)}',
  {${titleImplementation}${descriptionImplementation}${inputSchemaImplementation}${outputSchemaImplementation}${annotationsImplementation}
  },
  ${handlerCallImplementation}
);`;
	}).join("\n");
	const importToolSchemas = Object.values(verbOptions).flatMap((verbOption) => {
		const imports = [];
		const pascalOperationName = pascal(verbOption.typeName);
		if (verbOption.headers) imports.push(`  ${pascalOperationName}Header`);
		if (verbOption.params.length > 0) imports.push(`  ${pascalOperationName}Params`);
		if (verbOption.queryParams) imports.push(`  ${pascalOperationName}QueryParams`);
		if (verbOption.body.definition) imports.push(`  ${pascalOperationName}Body`);
		if (hasResponseSchema) imports.push(`  ${pascalOperationName}Response`);
		return imports;
	}).join(",\n");
	const toolSchemasPath = path.join(dirname, `tool-schemas.zod${extension}`);
	const importToolSchemasImplementation = `import {\n${importToolSchemas}\n} from '${upath.getRelativeImportPath(serverPath, toolSchemasPath)}';`;
	const importHandlersImplementation = `import {\n${Object.values(verbOptions).filter((verbOption) => toolImplementations.includes(`${verbOption.operationName}Handler`)).map((verbOption) => `  ${verbOption.operationName}Handler`).join(`,\n`)}\n} from '${upath.getRelativeImportPath(serverPath, targetPath)}';`;
	const createMcpServerImplementation = `
const createMcpServer = (options?: RequestInit): { server: McpServer; tools: Record<string, RegisteredTool> } => {
  const server = new McpServer({
    name: '${camel(info.title)}Server',
    version: '1.0.0',
  });
  const tools: Record<string, RegisteredTool> = {};
${toolImplementations}

  return { server, tools };
};
`;
	const serverFunctionName = mcpServerOptions?.name ?? "customServer";
	const relativeServerPath = mcpServerOptions ? upath.getRelativeImportPath(serverPath, mcpServerOptions.path) : "";
	const importSpecifier = mcpServerOptions?.default ? serverFunctionName : `{ ${serverFunctionName} }`;
	const importDependenciesImplementation = `import {
  McpServer,
  type RegisteredTool,
} from '@modelcontextprotocol/sdk/server/mcp.js';

${mcpServerOptions ? `import ${importSpecifier} from '${relativeServerPath}';` : `import {
  StdioServerTransport
} from '@modelcontextprotocol/sdk/server/stdio.js';`}
`;
	const customServerConnectImplementation = `\n${serverFunctionName}(createMcpServer);\n`;
	return [{
		content: [
			header,
			importDependenciesImplementation,
			importHandlersImplementation,
			importToolSchemasImplementation,
			createMcpServerImplementation,
			mcpServerOptions ? customServerConnectImplementation : `
const { server } = createMcpServer();
const transport = new StdioServerTransport();

server.connect(transport).then(() => {
  console.error('MCP server running on stdio');
}).catch(console.error);
`
		].join("\n"),
		path: serverPath
	}];
};
const generateZodFiles = async (verbOptions, output, context) => {
	const info = getSpecInfo(context);
	const { extension, dirname } = getMcpTargetInfo(output, info);
	const header = getHeader(output.override.header, info);
	const zods = await Promise.all(Object.values(verbOptions).map(async (verbOption) => generateZod(verbOption, {
		route: verbOption.route,
		pathRoute: verbOption.pathRoute,
		override: output.override,
		context,
		output: output.target
	}, output.client)));
	const allMutators = new Map(zods.flatMap((z) => z.mutators ?? []).map((m) => [m.name, m])).values().toArray();
	const mutatorsImports = generateMutatorImports({ mutators: allMutators });
	let content = `${header}${getZodSchemaImportStatement(output.override.zod.variant)}\n${mutatorsImports}\n`;
	const zodPath = path.join(dirname, `tool-schemas.zod${extension}`);
	content += zods.map((zod) => zod.implementation).join("\n");
	return [{
		content,
		path: zodPath
	}];
};
const generateHttpClientFiles = async (verbOptions, output, context) => {
	const info = getSpecInfo(context);
	const { path: targetPath, extension, dirname } = getMcpTargetInfo(output, info);
	const outputPath = path.join(dirname, `http-client${extension}`);
	const header = getHeader(output.override.header, info);
	const clients = await Promise.all(Object.values(verbOptions).map(async (verbOption) => {
		const options = {
			route: getFullRoute(verbOption.route, context.spec.servers, output.baseUrl),
			pathRoute: verbOption.pathRoute,
			override: output.override,
			context,
			output: output.target
		};
		return generateClient(verbOption, options, output.client, output);
	}));
	const clientImplementation = clients.map((client) => client.implementation).join("\n");
	const isZodSchemaOutput = isObject(output.schemas) && output.schemas.type === "zod";
	const schemasPath = isObject(output.schemas) ? output.schemas.path : isString(output.schemas) ? output.schemas : void 0;
	const basePath = schemasPath ? getFileInfo(schemasPath).dirname : void 0;
	const relativeSchemasPath = basePath ? isZodSchemaOutput && output.indexFiles ? upath.getRelativeImportPath(targetPath, basePath, true) : upath.getRelativeImportPath(targetPath, basePath) : upath.getRelativeImportPath(outputPath, targetPath);
	const importNames = clients.flatMap((client) => client.imports).map((imp) => imp.name);
	const importImplementation = `import type { ${new Set(importNames).values().toArray().join(",\n")} } from '${relativeSchemasPath}';`;
	const rawFetchHeader = generateFetchHeader({
		title: "",
		isRequestOptions: false,
		isMutator: false,
		noFunction: false,
		isGlobalMutator: false,
		provideIn: false,
		hasAwaitedType: false,
		output,
		verbOptions,
		clientImplementation
	});
	return [{
		content: [
			header,
			importImplementation,
			typeof rawFetchHeader === "string" ? rawFetchHeader : [rawFetchHeader.implementation, ...(rawFetchHeader.sharedTypes ?? []).map((t) => `${t.exported ? "export " : ""}${t.code}`)].join("\n"),
			clientImplementation
		].join("\n"),
		path: outputPath
	}];
};
const generateExtraFiles = async (verbOptions, output, context) => {
	const server = generateServer(verbOptions, output, context);
	const [zods, httpClients] = await Promise.all([generateZodFiles(verbOptions, output, context), generateHttpClientFiles(verbOptions, output, context)]);
	return [
		...server,
		...zods,
		...httpClients
	];
};
const mcpClientBuilder = {
	client: generateMcp,
	header: getMcpHeader,
	extraFiles: generateExtraFiles
};
const builder = () => () => mcpClientBuilder;
//#endregion
export { builder, builder as default, generateExtraFiles, generateMcp, generateServer, getMcpHeader };

//# sourceMappingURL=index.mjs.map