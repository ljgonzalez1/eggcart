const path = require('path');

const EggCart = require(path.join(__dirname, 'modules', 'Eggcart'))
/**
 * Initialize the EggCart with the database location.
 * @type {EggCart}
 */
const eggCart = new EggCart(String(process.env.DATABASE_LOCATION));

// Set up the EggCart functionalities
eggCart.addItemEn()
eggCart.addItemEs()
eggCart.getListEn()
eggCart.getListEs()
eggCart.deleteItemEn()
eggCart.deleteItemEs()
eggCart.clearListEn()
eggCart.clearListEs()
eggCart.start()
eggCart.help()
eggCart.helpEs()
eggCart.connect()
