// var serverurl = "https://apibim.cloudes.eu:8443";
var serverurl = "http://localhost:8082";
var serverusr = "admin@ifcserver.com";
var serverpwd = "admin";
//Drawing tools
var btnStraightLine = document.getElementById("btn_draw_straightline");
var btnFreeHandLine = document.getElementById("btn_draw_freeline");
var btnSeveralLine = document.getElementById("btn_draw_severalline");
var btnCircle = document.getElementById("btn_draw_circle");
var btnRect = document.getElementById("btn_draw_rect");
var btnText = document.getElementById("btn_draw_text");
var btnLocationText = document.getElementById("btn_draw_locationtext");

var btnCalcAngle = document.getElementById("btn_calc_angle");
var btnCalcSamePlane = document.getElementById("btn_calc_sameplane");
var btnCalcTotalArea = document.getElementById("btn_calc_totalarea");
var btnCalcCommonLength = document.getElementById("btn_calc_commonlength");
var btnCalcTargetLength = document.getElementById("btn_calc_targetlength");
var btnCalcEdgeCalibrate = document.getElementById("btn_calc_edgecalibrate");
var btnCalcVertexCalibrate = document.getElementById("btn_calc_vertexcalibrate");
var btnCalcVolume = document.getElementById("btn_calc_volume");
var btnCalcCircleDiameter = document.getElementById("btn_calc_circle_diameter");
var btnCalcCircleCircum = document.getElementById("btn_calc_circle_circum");
var btnDeleteDimension = document.getElementById("btn_delete_dimension");

var btnPicker = document.getElementById("btn_picker");
var btnPanMove = document.getElementById("btn_pan");
var btnOrbit = document.getElementById("btn_orbit");
var btnPushPull = document.getElementById("pushpull");
var btnConnectCorner = document.getElementById("connectcorner");
var btnSquareMarker = document.getElementById("btn_squaremarker");
var btnRotateEntity = document.getElementById("rotateentity");
var btnBucket = document.getElementById("btn_bucket");

var btnDrawingTools = [];
btnDrawingTools.push(btnStraightLine);
btnDrawingTools.push(btnFreeHandLine);
btnDrawingTools.push(btnSeveralLine);
btnDrawingTools.push(btnCircle);
btnDrawingTools.push(btnRect);
btnDrawingTools.push(btnText);
btnDrawingTools.push(btnLocationText);
btnDrawingTools.push(btnCalcAngle);
btnDrawingTools.push(btnCalcSamePlane);
btnDrawingTools.push(btnCalcTotalArea);
// btnDrawingTools.push(btnCalcCommonLength);
btnDrawingTools.push(btnCalcTargetLength);
btnDrawingTools.push(btnCalcEdgeCalibrate);
btnDrawingTools.push(btnCalcVertexCalibrate);
btnDrawingTools.push(btnCalcVolume);
// btnDrawingTools.push(btnDeleteDimension);
btnDrawingTools.push(btnCalcCircleDiameter);
// btnDrawingTools.push(btnCalcCircleCircum);
btnDrawingTools.push(btnPicker);
btnDrawingTools.push(btnPanMove);
btnDrawingTools.push(btnOrbit);
btnDrawingTools.push(btnPushPull);
btnDrawingTools.push(btnConnectCorner);
btnDrawingTools.push(btnSquareMarker);
btnDrawingTools.push(btnRotateEntity);
btnDrawingTools.push(btnBucket);

function onNewDimensions(actionName) {
    var iframe = document.getElementById('bimviewer');
    iframe.contentWindow.initDrawingTools();
    iframe.contentWindow.setDrawAction('measure');
    iframe.contentWindow.newDimensions(actionName);
}

function onDeleteDimensions() {
    var iframe = document.getElementById('bimviewer');
    iframe.contentWindow.deleteDimensions();
}

function getScene() {
    if ($('#bimviewer').contents().find('canvas').length !== 0) {
        var iframe = document.getElementById('bimviewer');
        return iframe.contentWindow.getScene();
    } else
        return false;
}

function initDrawingToolbar() {
    btnDrawingTools.forEach(element => {
        if (element.classList.contains("toolbar-select")) {
            element.classList.remove("toolbar-select");
        }
    });
}

//Option tools 
var chkShaded = document.getElementById("chk_shaded");
var chkWire = document.getElementById("chk_wire");
var chkTransp = document.getElementById("chk_transp");
var chkEdge = document.getElementById("chk_edge");
var chkGrid = document.getElementById("chk_grid");

var chkPersp = document.getElementById("chk_persp");
var chkOrtho = document.getElementById("chk_ortho");
var chkTop = document.getElementById("chk_top");
var chkBottom = document.getElementById("chk_bottom");
var chkFront = document.getElementById("chk_front");
var chkBack = document.getElementById("chk_back");
var chkLeft = document.getElementById("chk_left");
var chkRight = document.getElementById("chk_right");
var chkCam = [chkPersp, chkOrtho, chkTop, chkBottom, chkFront, chkBack, chkLeft, chkRight];

var modalDlgContainer = document.getElementById("modal_dlg_container");
var dlgEditText = document.getElementById("dlg_edittext");
var dlgOpenProject = document.getElementById("dlg_openproject");
var dlgUpload = document.getElementById("dlg_upload");
var dlgARView = document.getElementById("dlg_arview");

function initDialog() {
    closeDlgEditText();
    closeDlgProject();
    closeDlgUpload();
}

initDialog();

function onbtnPicker() {
    if ($('#bimviewer').contents().find('canvas').length === 0)
        return;

    initDrawingToolbar();
    btnPicker.classList.add("toolbar-select");

    var iframe = document.getElementById('bimviewer');
    iframe.contentWindow.initDrawingTools();
    iframe.contentWindow.setDefaultDragAction('picker');
}

function onbtnPanMove() {
    if ($('#bimviewer').contents().find('canvas').length === 0)
        return;

    initDrawingToolbar();
    btnPanMove.classList.add("toolbar-select");

    var iframe = document.getElementById('bimviewer');
    iframe.contentWindow.initDrawingTools();
    iframe.contentWindow.setDefaultDragAction('pan');
}

function onbtnOrbit() {
    if ($('#bimviewer').contents().find('canvas').length === 0)
        return;

    initDrawingToolbar();
    btnOrbit.classList.add("toolbar-select");

    var iframe = document.getElementById('bimviewer');
    iframe.contentWindow.initDrawingTools();
    iframe.contentWindow.setDefaultDragAction('orbit');
}

function initChkCam(){
    chkCam.forEach(function(e){
        e.classList.remove("fa-check");
    });
}
// Control Camera View
function onCheckCameras(type) {
    if ($('#bimviewer').contents().find('canvas').length === 0)
        return;
    initChkCam();
    switch (type) {
        case "perspective":
            if (chkPersp.classList.contains("fa-check")) {
                chkPersp.classList.remove("fa-check");
            } else {
                chkPersp.classList.add("fa-check");
            }
            break;
        case "ortho":
            if (chkOrtho.classList.contains("fa-check")) {
                chkOrtho.classList.remove("fa-check");
            } else {
                chkOrtho.classList.add("fa-check");
            }
            break;
        case "top":
            if (chkTop.classList.contains("fa-check")) {
                chkTop.classList.remove("fa-check");
            } else {
                chkTop.classList.add("fa-check");
            }
            break;
        case "bottom":
            if (chkBottom.classList.contains("fa-check")) {
                chkBottom.classList.remove("fa-check");
            } else {
                chkBottom.classList.add("fa-check");
            }
            break;
        case "front":
            if (chkFront.classList.contains("fa-check")) {
                chkFront.classList.remove("fa-check");
            } else {
                chkFront.classList.add("fa-check");
            }
            break;
        case "back":
            if (chkPersp.classList.contains("fa-check")) {
                chkPersp.classList.remove("fa-check");
            } else {
                chkPersp.classList.add("fa-check");
            }
            break;
        case "left":
            if (chkLeft.classList.contains("fa-check")) {
                chkLeft.classList.remove("fa-check");
            } else {
                chkLeft.classList.add("fa-check");
            }
            break;
        case "right":
            if (chkRight.classList.contains("fa-check")) {
                chkRight.classList.remove("fa-check");
            } else {
                chkRight.classList.add("fa-check");
            }
            break;
    }

    var iframe = document.getElementById('bimviewer');
    iframe.contentWindow.setCameraView(type);
}
// Control view method
var isWire = false;
var isGrid = true;

function onCheckViews(type) {
    if ($('#bimviewer').contents().find('canvas').length === 0)
        return;
    switch (type) {
        case "shaded":
            isWire = false;
            if (!chkShaded.classList.contains("fa-check")) {
                chkShaded.classList.add("fa-check");
                chkWire.classList.remove("fa-check");
            }
            break;
        case "wire":
            isWire = true;
            if (!chkWire.classList.contains("fa-check")) {
                chkWire.classList.add("fa-check");
                chkShaded.classList.remove("fa-check");
            }
            break;
        case "transp":
            if (isWire)
                return;
            if (chkTransp.classList.contains("fa-check")) {
                chkTransp.classList.remove("fa-check");
            } else {
                chkTransp.classList.add("fa-check");
            }
            break;
        case "edge":
            if (isWire)
                return;
            if (chkEdge.classList.contains("fa-check")) {
                chkEdge.classList.remove("fa-check");
            } else {
                chkEdge.classList.add("fa-check");
            }
            break;
        case "grid":
            if (chkGrid.classList.contains("fa-check")) {
                chkGrid.classList.remove("fa-check");
                isGrid = false;
            } else {
                chkGrid.classList.add("fa-check");
                isGrid = true;
            }
            break;
    }
    if ($('#bimviewer').contents().find('canvas').length !== 0) {
        var iframe = document.getElementById('bimviewer');
        iframe.contentWindow.setViewMethod(type);
    }
    if ($('#bimviewer').contents().find('canvas').length !== 0) {
        var iframe = document.getElementById('bimviewer');
        iframe.contentWindow.showGrid(isGrid);
    }
}

function openDlgProject() {
    dlgOpenProject.style.display = "flex";
    modalDlgContainer.style.display = "flex";
}

function closeDlgProject() {
    dlgOpenProject.style.display = "none";
    modalDlgContainer.style.display = "none";
}

function openDlgUpload() {
    dlgUpload.style.display = "flex";
    modalDlgContainer.style.display = "flex";
}

function closeDlgUpload() {
    dlgUpload.style.display = "none";
    modalDlgContainer.style.display = "none";
}
$('#btn_new_project').click(function () {
    initDomElements();
    newProject();
});

$('#btn_open_project').click(function () {
    openDlgProject();
    initDomElements();
    importProjectsFromBS();
});

$('#btn_upload').click(function () {
    openDlgUpload();
});

$('.collision-sub').click(function () {
    if (!$(this).parent().hasClass("active")) {
        $(this).find('.eye-small').css("display", "none");
        $(this).find('.eye-large').css('display', 'block');
    } else {
        $(this).find('.eye-small').css("display", "block");
        $(this).find('.eye-large').css('display', 'none');
    }
});

// measure common length
$('#btn_calc_commonlength').click(function () {
    if ($('#bimviewer').contents().find('canvas').length === 0)
        return;
    initDrawingToolbar();
    btnCalcCommonLength.classList.add("toolbar-select");
    onNewDimensions("CommonLength");
});

// measure target length
$('#btn_calc_targetlength').click(function () {
    if ($('#bimviewer').contents().find('canvas').length === 0)
        return;
    initDrawingToolbar();
    btnCalcTargetLength.classList.add("toolbar-select");
    onNewDimensions("TargetLength");
});

// measure edge calibrate
$('#btn_calc_edgecalibrate').click(function () {
    if ($('#bimviewer').contents().find('canvas').length === 0)
        return;
    initDrawingToolbar();
    btnCalcEdgeCalibrate.classList.add("toolbar-select");
    onNewDimensions("EdgeCalibrate");
});

// measure vertex calibrate
$('#btn_calc_vertexcalibrate').click(function () {
    if ($('#bimviewer').contents().find('canvas').length === 0)
        return;
    initDrawingToolbar();
    btnCalcVertexCalibrate.classList.add("toolbar-select");
    onNewDimensions("VertexCalibrate");
});

// measure same plane
$('#btn_calc_sameplane').click(function () {
    if ($('#bimviewer').contents().find('canvas').length === 0)
        return;
    initDrawingToolbar();
    btnCalcSamePlane.classList.add("toolbar-select");
    onNewDimensions("SamePlane");
});

// measure total area
$('#btn_calc_totalarea').click(function () {
    if ($('#bimviewer').contents().find('canvas').length === 0)
        return;
    initDrawingToolbar();
    btnCalcTotalArea.classList.add("toolbar-select");
    onNewDimensions("TotalArea");
});

// measure area
$('#btn_calc_volume').click(function () {
    if ($('#bimviewer').contents().find('canvas').length === 0)
        return;
    initDrawingToolbar();
    btnCalcVolume.classList.add("toolbar-select");
    onNewDimensions("Volume");
});

// measure angle
$('#btn_calc_angle').click(function () {
    if ($('#bimviewer').contents().find('canvas').length === 0)
        return;
    initDrawingToolbar();
    btnCalcAngle.classList.add("toolbar-select");
    onNewDimensions("Angle");
});

// measure circle diameter
$('#btn_calc_circle_diameter').click(function () {
    if ($('#bimviewer').contents().find('canvas').length === 0)
        return;
    initDrawingToolbar();
    btnCalcCircleDiameter.classList.add("toolbar-select");
    onNewDimensions("CircleDiameter");
});

// measure circle circumference
$('#btn_calc_circle_circum').click(function () {
    if ($('#bimviewer').contents().find('canvas').length === 0)
        return;
    initDrawingToolbar();
    btnCalcCircleCircum.classList.add("toolbar-select");
    onNewDimensions("CircleCircum");
});

// delete dimensions
$('#btn_delete_dimension').click(function () {
    if ($('#bimviewer').contents().find('canvas').length === 0)
        return;
    initDrawingToolbar();
    btnDeleteDimension.classList.add("toolbar-select");
    onDeleteDimensions();
});

// draw straight lines
$('#btn_draw_straightline').click(function () {
    if ($('#bimviewer').contents().find('canvas').length === 0)
        return;
    initDrawingToolbar();
    btnStraightLine.classList.add("toolbar-select");
    var iframe = document.getElementById('bimviewer');
    iframe.contentWindow.initDrawingTools();
    iframe.contentWindow.setDrawAction('line');
    iframe.contentWindow.newStraightLine();
});
// draw free lines
$('#btn_draw_freeline').click(function () {
    if ($('#bimviewer').contents().find('canvas').length === 0)
        return;
    initDrawingToolbar();
    btnFreeHandLine.classList.add("toolbar-select");
    var iframe = document.getElementById('bimviewer');
    iframe.contentWindow.initDrawingTools();
    iframe.contentWindow.setDrawAction('line');
    iframe.contentWindow.newFreeLine();
});

// draw serveral lines
$('#btn_draw_severalline').click(function () {
    if ($('#bimviewer').contents().find('canvas').length === 0)
        return;
    initDrawingToolbar();
    btnSeveralLine.classList.add("toolbar-select");
    var iframe = document.getElementById('bimviewer');
    iframe.contentWindow.initDrawingTools();
    iframe.contentWindow.setDrawAction('line');
    iframe.contentWindow.newSeveralLine();
});

// draw circles
$('#btn_draw_circle').click(function () {
    if ($('#bimviewer').contents().find('canvas').length === 0)
        return;
    initDrawingToolbar();
    btnCircle.classList.add("toolbar-select");
    var iframe = document.getElementById('bimviewer');
    iframe.contentWindow.initDrawingTools();
    iframe.contentWindow.setDrawAction('circle');
    iframe.contentWindow.newCircle();
});

// draw rect
$('#btn_draw_rect').click(function () {
    if ($('#bimviewer').contents().find('canvas').length === 0)
        return;
    initDrawingToolbar();
    btnRect.classList.add("toolbar-select");
    var iframe = document.getElementById('bimviewer');
    iframe.contentWindow.initDrawingTools();
    iframe.contentWindow.setDrawAction('rect');
    iframe.contentWindow.newRect();
});

// bucket
$('#btn_bucket').click(function () {
    if ($('#bimviewer').contents().find('canvas').length === 0)
        return;
    initDrawingToolbar();
    btnBucket.classList.add("toolbar-select");
    var iframe = document.getElementById('bimviewer');
    iframe.contentWindow.initDrawingTools();
    iframe.contentWindow.setDrawAction('bucket');
    iframe.contentWindow.onBucket();
});

var actionText;

function setValueForText() {
    closeDlgEditText();
    var iframe = document.getElementById('bimviewer');
    iframe.contentWindow.initDrawingTools();
    iframe.contentWindow.setDrawAction('text');
    var textContent = document.getElementById("text_content").value;
    var textSize = document.getElementById("text_size").value;
    iframe.contentWindow.newText(actionText, textContent, textSize);
}

function openDlgEditText() {
    dlgEditText.style.display = "flex";
    modalDlgContainer.style.display = "flex";
}

function closeDlgEditText() {
    dlgEditText.style.display = "none";
    modalDlgContainer.style.display = "none";
}

// draw texts
$('#btn_draw_text').click(function () {
    if ($('#bimviewer').contents().find('canvas').length === 0)
        return;
    initDrawingToolbar();
    btnText.classList.add("toolbar-select");
    openDlgEditText();
    actionText = "text";
});

// draw location texts
$('#btn_draw_locationtext').click(function () {
    if ($('#bimviewer').contents().find('canvas').length === 0)
        return;
    initDrawingToolbar();
    btnLocationText.classList.add("toolbar-select");
    openDlgEditText();
    actionText = "locationtext";
});

//push pull
$('#pushpull').click(function () {
    if ($('#bimviewer').contents().find('canvas').length === 0)
        return;
    initDrawingToolbar();
    btnPushPull.classList.add("toolbar-select");
    var iframe = document.getElementById('bimviewer');
    iframe.contentWindow.initDrawingTools();
    iframe.contentWindow.setDrawAction('pushpull');
    iframe.contentWindow.onPushPull();
});

//connect corner
$('#connectcorner').click(function () {
    if ($('#bimviewer').contents().find('canvas').length === 0)
        return;
    initDrawingToolbar();
    btnConnectCorner.classList.add("toolbar-select");
    var iframe = document.getElementById('bimviewer');
    iframe.contentWindow.initDrawingTools();
    iframe.contentWindow.setDrawAction('connectcorner');
    iframe.contentWindow.onConnectCorner();
});

//Square marker
$('#btn_squaremarker').click(function () {
    if ($('#bimviewer').contents().find('canvas').length === 0)
        return;
    initDrawingToolbar();
    btnSquareMarker.classList.add("toolbar-select");
    var iframe = document.getElementById('bimviewer');
    iframe.contentWindow.initDrawingTools();
    iframe.contentWindow.setDrawAction('squaremarker');
    iframe.contentWindow.onSquareMarker();
});

//Rotate Enitity
$('#rotateentity').click(function () {
    if ($('#bimviewer').contents().find('canvas').length === 0)
        return;
    initDrawingToolbar();
    btnRotateEntity.classList.add("toolbar-select");
    var iframe = document.getElementById('bimviewer');
    iframe.contentWindow.initDrawingTools();
    iframe.contentWindow.setDrawAction('rotateentity');
    iframe.contentWindow.onRotateEntity();
});

function convertFloat3ColorToString(color) {
    var r = color[0];
    var g = color[1];
    var b = color[2];

    var r_ = Math.floor(r * 255);
    var g_ = Math.floor(g * 255);
    var b_ = Math.floor(b * 255);

    // convert hex
    var r__ = r_.toString(16);
    var g__ = g_.toString(16);
    var b__ = b_.toString(16);
    return '#' + r__ + g__ + b__;
}

function convertStringToFloat3Color(str) {

    var r = str.substring(1, 3);
    var g = str.substring(3, 5);
    var b = str.substring(5, 7);

    // convert dex
    var r_ = parseInt(r, 16);
    var g_ = parseInt(g, 16);
    var b_ = parseInt(b, 16);

    var r__ = r_ / 255;
    var g__ = g_ / 255;
    var b__ = b_ / 255;

    var color = [r__, g__, b__];
    return color;
}

$('#btn_edit_material').click(function () {
    if ($('#bimviewer').contents().find('canvas').length === 0)
        return;
    document.getElementById('dlg_edit_materials').style.display = document.getElementById('dlg_edit_materials').style.display === 'none' ? 'flex' : 'none';
    var iframe = document.getElementById('bimviewer');
    var material = iframe.contentWindow.getSelectedMaterial();
    var type = material._state.type;
    var edit_material_name = document.getElementById('edit_mat_name');
    edit_material_name.innerText = type + ' - ' + material.id;

    var edit_values = document.getElementById('edit_mat_values');
    edit_values.innerHTML = '';
    switch (type) {
        case 'EmphasisMaterial':
            var fill_tr = document.createElement('tr');
            var fill_td_0 = document.createElement('td');
            var fill_td_1 = document.createElement('td');
            var fill_label = document.createElement('label');
            fill_label.innerText = 'Fill';
            fill_label.classList.add('material-edit-value-label');
            var fill_check = document.createElement('input');
            fill_check.type = 'checkbox';
            fill_check.classList.add('material-edit-value-check');
            fill_td_0.appendChild(fill_label);
            fill_td_1.appendChild(fill_check);
            fill_tr.appendChild(fill_td_0);
            fill_tr.appendChild(fill_td_1);

            var fill_color_tr = document.createElement('tr');
            var fill_color_td_0 = document.createElement('td');
            var fill_color_td_1 = document.createElement('td');
            var fill_color_label = document.createElement('label');
            fill_color_label.innerText = 'Fill Color';
            fill_color_label.classList.add('material-edit-value-label');
            var fill_color_div = document.createElement('div');
            fill_color_div.classList.add('material-edit-value-div');

            var fill_color_value = material.fillColor;
            fill_color_value = convertFloat3ColorToString(fill_color_value);
            fill_color_div.style.background = fill_color_value;
            fill_color_td_0.appendChild(fill_color_label);
            fill_color_td_1.appendChild(fill_color_div);
            fill_color_tr.appendChild(fill_color_td_0);
            fill_color_tr.appendChild(fill_color_td_1);



            var fill_color_picker = new Picker({
                parent: fill_color_div,
                popup: 'right',
                alpha: false,
                color: fill_color_value
            });

            fill_color_picker.onChange = function (color) {
                fill_color_div.style.background = color.rgbaString;
                material.fillColor = [color.rgba[0] / 255, color.rgba[1] / 255, color.rgba[2] / 255];
                iframe.contentWindow.changeSelectedMaterial(material);
            };
            //Open the popup manually:
            // fill_color_picker.openHandler();

            edit_values.appendChild(fill_tr);
            edit_values.appendChild(fill_color_tr);
            break;
        case 'PhongMaterial':
            break;
        case 'MetallicMaterial':
            break;
        case 'SpecularMaterial':
            break;
        case 'OutlineMaterial':
            break;
        default:
            break;
    }

});

var selectedProject;
var token;

function newProject() {
    $('#bimviewer').attr('src', "../bimsurfer/examples/bimserver.html");
}

function importProjectsFromBS() {
    var projectUrls = {};
    var bimServerStatus = document.getElementById('bimserver_status');

    function loadFromBimserver(address, username, password, target) {
        target.innerHTML = "";
        var client = new BimServerClient(address);
        if (client.user === null) {
            bimServerStatus.innerText = "BimServer not found";
        }
        client.init(function () {
            var projectIndex = 0;
            projectUrls = {};
            bimServerStatus.textContent = "Logging in...";
            client.login(username, password, function () {
                bimServerStatus.textContent = "Getting all projects...";
                client.call("ServiceInterface", "getAllProjects", {
                    onlyTopLevel: true,
                    onlyActive: true
                }, function (projects) {
                    var totalFound = 0;
                    projects.forEach(function (project) {
                        if (project.lastRevisionId != -1) {
                            var pName = document.createElement("div");
                            pName.textContent = project.name;
                            pName.classList.add('project-name');
                            var id = 'project' + projectIndex;
                            pName.id = id;
                            projectUrls[id] = "../bimsurfer/examples/bimserver.html?address=" + encodeURIComponent(address) + "&token=" + client.token + "&poid=" + project.oid;
                            pName.addEventListener('click', function (event) {
                                $('#bimviewer').attr('src', projectUrls[id]);
                                $('#modal_dlg_container').css('display', 'none');
                                $('#dlg_openproject').css('display', 'none');
                                selectedProject = project;
                                token = client.token;
                            });
                            target.appendChild(pName);
                            totalFound++;
                            projectIndex++;
                        }
                    });
                    if (totalFound == 0) {
                        bimServerStatus.textContent = "No projects with revisions found on this server";
                    } else {
                        bimServerStatus.textContent = "";
                    }
                });
            }, function (error) {
                console.error(error);
                bimServerStatus.innerText = error.message;
            });
        });
    }

    function loadBimServerApi(apiAddress, loadUmd) {
        //console.log(loadUmd);
        var p = new Promise(function (resolve, reject) {
            if (loadUmd) {
                // TODO
                LazyLoad.js([Settings.getBimServerApiAddress() + "/bimserverapi.umd.js?_v=" + apiVersion], function () {
                    window.BimServerClient = bimserverapi.default;
                    window.BimServerApiPromise = bimserverapi.BimServerApiPromise;

                    resolve(bimserverapi);
                });
            } else {
                // Using eval here, so we don't trip the browsers that don't understand "import"
                // The reason for using it this way is so we can develop this library and test it without having to transpile.
                // Obviously developers need to have a browser that understands "import" (i.e. a recent version of Chrome, Firefox etc...)

                // TODO One remaining problem here is that dependencies are not loaded with the "apiVersion" attached, so you need to have your browser on "clear cache" all the time

                var apiVersion = new Date().getTime();
                console.log(apiVersion);

                var str = "import(\"" + apiAddress + "\" + \"/bimserverclient.js?_v=" + apiVersion + "\").then((bimserverapi) => {	window.BimServerClient = bimserverapi.default; window.BimServerApiPromise = bimserverapi.BimServerApiPromise; resolve(bimserverapi);});";
                console.log(str);
                eval(str);
            }
        });
        return p;
    }

    loadBimServerApi(serverurl + "/apps/bimserverjavascriptapi", false).then(() => {
        try {
            loadFromBimserver(serverurl, serverusr, serverpwd, document.getElementById("project_list"));
        } catch (e) {}
    });
}


var dlgStructuresContent = document.getElementById("dlg_structures_content");
var dlgLayersContent = document.getElementById("dlg_layers_content");
var dlgTypesContent = document.getElementById("dlg_types_content");

function initDomElements() {
    dlgStructuresContent.innerHTML = '';
    dlgLayersContent.innerHTML = '';
    dlgTypesContent.innerHTML = '';
}

function onCheckCam() {
    if (document.getElementById("cam_menu").classList.contains("show")) {
        document.getElementById("cam_menu").classList.remove("show-cam");
    } else {
        document.getElementById("cam_menu").classList.add("show-cam");
    }
    document.getElementById("view_menu").classList.remove("show-view");
}

function onCheckView() {
    if (document.getElementById("view_menu").classList.contains("show")) {
        document.getElementById("view_menu").classList.remove("show-view");
    } else {
        document.getElementById("view_menu").classList.add("show-view");
    }
    document.getElementById("cam_menu").classList.remove("show-cam");
}

function onShowHideDrawingToolbar(){
    var gtoolbar = document.getElementById("drawing_toolbar_group");
    gtoolbar.className = gtoolbar.className ? '' : 'hidden';
}

function onShowHideMeasureToolbar(){
    var gtoolbar = document.getElementById("measure_toolbar_group");
    gtoolbar.style.display = gtoolbar.style.display == 'none' ? 'block' : 'none';
}
onShowHideDrawingToolbar();
onShowHideMeasureToolbar();