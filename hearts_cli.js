import {HeartsModel} from "./hearts_model.js";
import {HeartsController} from "./hearts_controller.js";
import {HeartsCLIView} from "./hearts_cli_view.js";


let model = new HeartsModel();
let controller = new HeartsController(model);

// Change line below to use HeartsView instead of HeartsCLI for your submission.
let view = new HeartsCLIView(model, controller);

view.render(document.getElementById('main'));