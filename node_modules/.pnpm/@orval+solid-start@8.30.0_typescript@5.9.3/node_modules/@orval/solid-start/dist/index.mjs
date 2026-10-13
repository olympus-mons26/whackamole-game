import { Verbs, generateBodyOptions, generateFormDataAndUrlEncodedFunction, generateVerbImports, getIsBodyVerb, isObject, isOperationInTagBucket, jsStringLiteralEscape, logWarning, pascal, resolveRef, sanitize, toObjectString } from "@orval/core";
//#region src/index.ts
const SOLID_START_DEPENDENCIES = [{
	exports: [
		{
			name: "query",
			values: true
		},
		{
			name: "action",
			values: true
		},
		{
			name: "cache",
			values: true
		},
		{
			name: "revalidate",
			values: true
		}
	],
	dependency: "@solidjs/router"
}];
const resolveSchemaRef = (schema, context) => resolveRef(schema, context);
const getSolidStartDependencies = () => SOLID_START_DEPENDENCIES;
const generateSolidStartTitle = (title) => {
	const sanTitle = sanitize(title);
	return pascal(sanTitle);
};
const resolveNamespaceName = (title, verbOptions, tag) => {
	const importedNames = new Set(Object.values(verbOptions).filter((verbOption) => isOperationInTagBucket(verbOption, tag)).flatMap((verbOption) => generateVerbImports(verbOption).map((verbImport) => verbImport.alias ?? verbImport.name)));
	if (!importedNames.has(title)) return title;
	let candidate = `${title}Api`;
	for (let suffix = 2; importedNames.has(candidate); suffix++) candidate = `${title}Api${suffix}`;
	logWarning(`solid-start: exporting the namespace as \`${candidate}\` instead of \`${title}\`, because this file also imports a schema named \`${title}\`. Import \`${candidate}\` from this file, or rename the schema to keep \`${title}\`.`);
	return candidate;
};
const generateSolidStartHeader = ({ title, verbOptions, tag }) => {
	const namespace = resolveNamespaceName(title, verbOptions, tag);
	return `
/**
 * Cache Invalidation:
 *
 * Each query provides .key and .keyFor() for cache invalidation.
 *
 * Examples:
 *   // Invalidate all calls to a query
 *   revalidate(${namespace}.listPets.key);
 *
 *   // Invalidate a specific call with arguments
 *   revalidate(${namespace}.showPetById.keyFor("pet-123", 1));
 *
 *   // Invalidate multiple queries
 *   revalidate([${namespace}.listPets.key, ${namespace}.showPetById.keyFor("pet-123", 1)]);
 */
export const ${namespace} = {
`;
};
const generateSolidStartFooter = () => {
	return "};\n";
};
const generateImplementation = ({ headers, queryParams, operationName, response, mutator, body, props, verb, override, formData, formUrlEncoded }, { route, context, pathRoute }) => {
	const isFormData = !override.formData.disabled;
	const isFormUrlEncoded = override.formUrlEncoded !== false;
	const bodyForm = generateFormDataAndUrlEncodedFunction({
		formData,
		formUrlEncoded,
		body,
		isFormData,
		isFormUrlEncoded
	});
	const dataType = response.definition.success || "unknown";
	const isGetVerb = verb === Verbs.GET;
	const isBodyVerb = getIsBodyVerb(verb);
	if (mutator) {
		const propsImplementation = mutator.bodyTypeName && body.definition ? toObjectString(props, "implementation").replace(new RegExp(String.raw`(\w*):\s?${body.definition}`), `$1: ${mutator.bodyTypeName}<${body.definition}>`) : toObjectString(props, "implementation");
		const configParts = [`url: \`${route}\``, `method: '${verb.toUpperCase()}'`];
		if (queryParams) configParts.push("params");
		const ignoreContentTypes = ["multipart/form-data"];
		const overrideHeaders = isObject(override.requestOptions) && override.requestOptions.headers ? Object.entries(override.requestOptions.headers).map(([key, value]) => `'${key}': \`${value}\``) : [];
		const headersToAdd = [
			...body.contentType && !ignoreContentTypes.includes(body.contentType) ? [`'Content-Type': '${jsStringLiteralEscape(body.contentType)}'`] : [],
			...overrideHeaders,
			...headers ? ["...headers"] : []
		];
		if (headersToAdd.length > 0) configParts.push(`headers: { ${headersToAdd.join(",")} }`);
		const requestBodyParams = generateBodyOptions(body, isFormData, isFormUrlEncoded);
		if (requestBodyParams) {
			if (isFormData && body.formData || isFormUrlEncoded && body.formUrlEncoded) configParts.push(`data: ${requestBodyParams}`);
			else configParts.push(`data: ${requestBodyParams}`);
		}
		const axiosConfig = `{
      ${configParts.join(",\n      ")}
    }`;
		return `  ${operationName}: ${isGetVerb ? "query" : "action"}(async (${propsImplementation}) => {${bodyForm}
    return ${mutator.name}<${dataType}>(${axiosConfig});
  }, "${operationName}"),
`;
	}
	const propsImplementation = toObjectString(props, "implementation");
	const pathItem = context.spec.paths?.[pathRoute];
	const operation = pathItem?.[verb];
	const mergedParameters = [...pathItem?.parameters ?? [], ...operation?.parameters ?? []];
	const byKey = /* @__PURE__ */ new Map();
	for (const parameter of mergedParameters) {
		const { schema } = resolveRef(parameter, context);
		const parameterObject = schema;
		byKey.set(`${parameterObject.in}:${parameterObject.name}`, parameter);
	}
	const parameters = [...byKey.values()];
	const parameterObjects = parameters.map((parameter) => {
		const { schema } = resolveRef(parameter, context);
		return schema;
	});
	const explodeParameters = parameterObjects.filter((parameterObject) => {
		if (!parameterObject.schema) return false;
		const { schema: schemaObject } = resolveSchemaRef(parameterObject.schema, context);
		const isArrayLike = schemaObject.type === "array" || (schemaObject.oneOf ?? []).some((s) => resolveSchemaRef(s, context).schema.type === "array") || (schemaObject.anyOf ?? []).some((s) => resolveSchemaRef(s, context).schema.type === "array") || (schemaObject.allOf ?? []).some((s) => resolveSchemaRef(s, context).schema.type === "array");
		const isExploded = parameterObject.explode === true || parameterObject.explode === void 0 && (parameterObject.style === void 0 || parameterObject.style === "form");
		return parameterObject.in === "query" && isArrayLike && isExploded;
	});
	const explodeParametersNames = explodeParameters.map((parameter) => parameter.name);
	const hasExplodedDateParams = context.output.override.useDates && explodeParameters.some((parameter) => {
		if (!parameter.schema) return false;
		const { schema: schemaObject } = resolveSchemaRef(parameter.schema, context);
		const itemsFormat = schemaObject.items ? resolveSchemaRef(schemaObject.items, context).schema.format : void 0;
		return schemaObject.format === "date-time" || itemsFormat === "date-time";
	});
	const deepObjectParameters = parameterObjects.filter((parameterObject) => {
		return parameterObject.in === "query" && parameterObject.style === "deepObject";
	});
	const deepObjectParameterNames = deepObjectParameters.map((parameter) => parameter.name);
	const hasDeepObjectDateParams = context.output.override.useDates && deepObjectParameters.some((parameter) => {
		if (!parameter.schema) return false;
		const { schema: schemaObject } = resolveSchemaRef(parameter.schema, context);
		if (!schemaObject.properties) return false;
		return Object.values(schemaObject.properties).some((prop) => {
			const { schema: propSchema } = resolveSchemaRef(prop, context);
			return propSchema.format === "date-time";
		});
	});
	const isExplodeParametersOnly = explodeParameters.length + deepObjectParameters.length === parameters.length;
	const hasDateParams = context.output.override.useDates && parameterObjects.some((parameter) => {
		if (!parameter.schema) return false;
		const { schema: schemaObject } = resolveSchemaRef(parameter.schema, context);
		const itemsFormat = schemaObject.items ? resolveSchemaRef(schemaObject.items, context).schema.format : void 0;
		return schemaObject.format === "date-time" || itemsFormat === "date-time";
	});
	const explodeArrayImplementation = explodeParameters.length > 0 ? `const explodeParameters = ${JSON.stringify(explodeParametersNames)};

      if (Array.isArray(value) && explodeParameters.includes(key)) {
        value.forEach((v) => {
          normalizedParams.append(key, v === null ? 'null' : ${hasExplodedDateParams ? "v instanceof Date ? v.toISOString() : " : ""}String(v));
        });
        return;
      }
        ` : "";
	const deepObjectImplementation = deepObjectParameters.length > 0 ? `const deepObjectParameters = ${JSON.stringify(deepObjectParameterNames)};

      if (typeof value === 'object' && value !== null && !Array.isArray(value) && deepObjectParameters.includes(key)) {
        Object.entries(value).forEach(([subKey, subValue]) => {
          if (subValue !== undefined) {
            deepObjectEntries.push(encodeURIComponent(key) + '[' + encodeURIComponent(subKey) + ']=' + (subValue === null ? 'null' : encodeURIComponent(${hasDeepObjectDateParams ? "subValue instanceof Date ? subValue.toISOString() : " : ""}String(subValue))));
          }
        });
        return;
      }
        ` : "";
	const normalParamsImplementation = `if (value !== undefined) {
        normalizedParams.append(key, Array.isArray(value) ? value.map(v => v === null ? 'null' : ${hasDateParams ? "v instanceof Date ? v.toISOString() : " : ""}String(v)).join(',') : value === null ? 'null' : ${hasDateParams ? "value instanceof Date ? value.toISOString() : " : ""}String(value))
      }`;
	const queryParamsCode = queryParams ? `const normalizedParams = new URLSearchParams();
${deepObjectParameters.length > 0 ? "    const deepObjectEntries: string[] = [];\n" : ""}
    Object.entries(params || {}).forEach(([key, value]) => {
      ${explodeArrayImplementation}${deepObjectImplementation}
      ${isExplodeParametersOnly ? "" : normalParamsImplementation}
    });

    const queryString = ${deepObjectParameters.length > 0 ? `[normalizedParams.toString(), deepObjectEntries.join('&')].filter(Boolean).join('&')` : `normalizedParams.toString()`};
    const url = queryString ? \`${route}?\${queryString}\` : \`${route}\`;` : `const url = \`${route}\`;`;
	const headersCode = headers ? `headers: { ...headers, 'Content-Type': 'application/json' }` : `headers: { 'Content-Type': 'application/json' }`;
	const bodyCode = isBodyVerb && body.implementation ? `,
      body: JSON.stringify(${body.implementation})` : "";
	const functionName = isGetVerb ? "query" : "action";
	const fetchBodyPart = isGetVerb ? "" : bodyCode;
	return `  ${operationName}: ${functionName}(async (${propsImplementation}) => {${bodyForm}
    ${queryParamsCode}
    const response = await fetch(url, {
      method: '${verb.toUpperCase()}',
      ${headersCode}${fetchBodyPart}
    });
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    return response.json() as Promise<${dataType}>;
  }, "${operationName}"),
`;
};
const generateSolidStart = (verbOptions, options) => {
	const imports = generateVerbImports(verbOptions);
	return {
		implementation: generateImplementation(verbOptions, options),
		imports
	};
};
const solidStartClientBuilder = {
	client: generateSolidStart,
	header: generateSolidStartHeader,
	dependencies: getSolidStartDependencies,
	footer: generateSolidStartFooter,
	title: generateSolidStartTitle
};
const builder = () => () => solidStartClientBuilder;
//#endregion
export { builder, builder as default, generateSolidStart, generateSolidStartFooter, generateSolidStartHeader, generateSolidStartTitle, getSolidStartDependencies };

//# sourceMappingURL=index.mjs.map