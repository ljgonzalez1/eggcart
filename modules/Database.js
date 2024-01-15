const sqlite3 = require('sqlite3').verbose();

class Database {
    constructor(fp) {
        this.db = new sqlite3.Database(fp, (err) => {
            if (err) {
                console.error(err.message)
            }
            // console.log("connected to the database") log this later
        })
    }
    createTable(tableName, tableAttributes) {
        let sqlCommand = "CREATE TABLE IF NOT EXISTS " + tableName + "("

        tableAttributes.forEach(element => {
            sqlCommand += element['id'] + " " + element['type'] + ","
        });
        sqlCommand = sqlCommand.slice(0, -1) + ')'

        try {
            this.db.run(sqlCommand);
        }
        catch (err) { console.error(err) }
    }
    printAllTables() {
        this.db.all('SELECT name FROM sqlite_master WHERE type="table"', (err, tables) => {
            tables ? console.log(tables) : console.log(err)
        })
    }
}

class Supermarket extends Database {
    constructor(fp) {
        super(fp)
        this.grocery_list_attrs = [
            {'id': "item", 'type': 'UNIQUE' }
        ]
        this.table = 'eggo_list'
    }
    create(data) {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.createTable(this.table, this.grocery_list_attrs);
                
                // Ahora handleCreate debería ser modificado para manejar promesas
                this.handleCreate(data).then(result => {
                    resolve(true); // Si la creación fue exitosa
                }).catch(err => {
                    console.error(err);
                    resolve(false); // Si hubo un error
                });
            });
        });
    }
    
    handleCreate(data) {
        return new Promise((resolve, reject) => {
            let sqlCommand = `INSERT OR IGNORE INTO ${this.table} VALUES (?)`;
            let insert = this.db.prepare(sqlCommand);
            
            insert.run(data['item'], function(err) {
                if (err) {
                    console.log(err.message);
                    console.log(`Cannot insert this item because it already exists
                             \n if your need to update values - use update function `);
                    reject(err); // Rechazar la promesa con el error
                } else {
                    console.log("Entry has been created or already exists for " + data['item']);
                    resolve(); // Resolver la promesa exitosamente
                }
            });
        });
    }

    // can access this in the main by doing
    // let user = db.retreive(key).then((key) => {do whatever with key})
    retreive = (key) => {
        return new Promise((resolve, reject) => {
            let sqlCommand = `SELECT * FROM ${this.table} WHERE item = ?`

            this.db.get(sqlCommand, key, (err, rows) => {
                if (err || rows === undefined) {
                    reject()
                }
                resolve(rows)
            })
        })
    }
    
    handleUpdate = (item, new_item) => {
        this.retreive(item.item).then((item) => {
            let sqlCommand = `UPDATE ${this.table} SET item = ? WHERE item = ?`

            this.db.run(sqlCommand, [new_item,item.item], function (err) {
                if (err) {
                    return console.error(err.message)
                }
                console.log(`Row(s) updated: ${this.changes}`);
                console.log(`${item.item}`)
            })
        }).catch(() => {
            console.log("Unable to update entry - could not locate in database")
        }
        )
    }
    update(item_obj, new_item) {
        this.db.serialize(() => {
            this.handleUpdate(item_obj, new_item)
        })
    }
    delete = (key) => {
        this.retreive(key).then((user) => {
            let sqlCommand = `DELETE FROM ${this.table} WHERE item = ?`

            this.db.run(sqlCommand, key, function (err) {
                if (err) {
                    return console.error(err.message)
                }
                console.log(`row deleted ${this.changes}`)
            })
        }).catch(() => {
            console.log("Entry does not exist in DB cannot delete")
            return false
        })

    }
    printTable() {
        this.db.each(`SELECT item FROM ${this.table}`, (err, row) => {
            console.log(`Item: ${row.item}`)
        })
    }
    getTable() {
        return new Promise((resolve, reject) => {
            let shopping_list = [];
            this.db.each(`SELECT item FROM ${this.table}`, (err, row) => {
                if (err) {
                    console.log("we got a prob", err);
                    reject(err);
                    return;
                }
                shopping_list.push(row.item);
                }, () => {
                resolve(shopping_list);
            }
            );
        });
    }
}

export default Supermarket