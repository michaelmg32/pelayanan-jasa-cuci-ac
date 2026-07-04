const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverFile, 'utf8');

const oldStr = `  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});`;

const newStr = `  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});`;

serverContent = serverContent.replace(oldStr, newStr);

fs.writeFileSync(serverFile, serverContent, 'utf8');
console.log("Fixed syntax error in server.js!");
