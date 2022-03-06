import path from "path";
import prettier from "prettier";

const query =
	"SELECT * from users u join users_roles ur on ur.user_id = u.id where ur.role = 'admin'";

it("formats query", () => {
	expect(
		prettier.format(query, {
			parser: "sql",
			plugins: [path.dirname(__dirname)],
		})
	).toBe(`select *
from users u
join users_roles ur on ur.user_id = u.id
where ur.role = "admin";
`);
});
