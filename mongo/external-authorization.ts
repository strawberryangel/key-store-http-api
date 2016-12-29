var db
// The above is to silence TypeScript


db.createCollection("externalAuthorization",
    {
        validator: {
            $and: [
                {agent: {$type: "string"}}
            ]
        }
    }
);

db.externalAuthorization.createIndex(
    {agent: 1},
    {
        name: "primary",
        unique: true
    }
);

