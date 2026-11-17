declare function defineLazyProp<
    ObjectType extends { [key: string]: unknown },
    PropertyNameType extends string,
    PropertyValueType
>(
    objectStr: ObjectType,
    propertyNameStr: PropertyNameType,
    fnValue: () => PropertyValueType
): ObjectType & { [K in PropertyNameType]: PropertyValueType };

export = defineLazyProp;
