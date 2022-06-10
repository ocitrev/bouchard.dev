let CommonMaterialMap;
const sortLists = true;

let groupListbox;
let typeListbox;
let finishListbox;
let coatingListbox;
let base_roughness_slider;
let base_roughness_value;
let coat_roughness_slider;
let coat_roughness_value;

$(document).ready(function () {

    groupListbox = $('#groupListbox');
    typeListbox = $('#typeListbox');
    finishListbox = $('#finishListbox');
    coatingListbox = $('#coatingListbox');
    base_roughness_slider = $('#base_roughness_slider');
    base_roughness_value = $('#base_roughness_value');
    coat_roughness_slider = $('#coat_roughness_slider');
    coat_roughness_value = $('#coat_roughness_value');

    $.get("CommonMaterialMap.xml", function (data, status) {
        if (status) {
            CommonMaterialMap = data;
            loadGroups();
        } else {
            onSliderChange();
        }
    });

    let mcode = $('#mcode');
    let onlistfocus = function () {
        if (mcode.css('visibility') == 'hidden') {
            onCoatingChanged();
        }
    }
    let onsliderfocus = function () {
        if (mcode.css('visibility') != 'hidden') {
            onSliderChange();
        }
    }

    groupListbox.on({
        change: onGroupChanged,
        focusin: onlistfocus
    });

    typeListbox.on({
        change: onTypeChanged,
        focusin: onlistfocus
    });

    finishListbox.on({
        change: onFinishChanged,
        focusin: onlistfocus,
    });

    coatingListbox.on({
        change: onCoatingChanged,
        focusin: onlistfocus
    });

    base_roughness_slider.on({
        change: onSliderChange,
        input: onSliderChange,
        focusin: onsliderfocus
    });

    coat_roughness_slider.on({
        change: onSliderChange,
        input: onSliderChange,
        focusin: onsliderfocus
    });

});

function getNodePath(node) {
    let path = '';

    while (node != null && node.nodeName != '#document') {
        let name = node.getAttribute('name');
        let uniqName = node.nodeName;
        if (name !== null && name !== undefined) {
            uniqName += '[@name="' + name + '"]';
        }

        path = '/' + uniqName + path;
        node = node.parentNode;
    }

    return path;
}

function getVal(nodes, name, defValue) {
    for (let i = 0; i != nodes.length; ++i) {
        let node = nodes[i];
        let value = node.getAttribute(name);

        if (value === null || value === undefined) {
            value = node.parentNode.getAttribute(name);
        }

        if (value !== null && value !== undefined) {
            return value;
        }
    }

    return defValue;
}

function getMCode(gpath, tpath, fpath, cpath) {
    let group = $(CommonMaterialMap).xpath(gpath)[0];
    let type = $(CommonMaterialMap).xpath(tpath)[0];
    let finish = $(CommonMaterialMap).xpath(fpath)[0];
    let coating = $(CommonMaterialMap).xpath(cpath)[0];
    let gname = group.getAttribute('name');
    let tname = type.getAttribute('name');
    let fname = finish.getAttribute('name');
    let cname = coating.getAttribute('name');
    let order = [coating, finish, type, group];

    let ret = {
        MCode: gname + '.' + tname + '.' + fname + '.' + cname,
        BaseRoughness: parseFloat(getVal(order, 'BaseRoughness', '0.9')),
        CoatRoughness: getVal(order, 'CoatRoughness', null),
        NbLayers: parseInt(getVal(order, 'NbLayers', '1')),
        Likelyhood: parseFloat(getVal(order, 'Likelyhood', '1.0')),
        BaseRefractIndex: getVal(order, 'BaseRefractIndex', null),
        CoatRefractIndex: getVal(order, 'CoatRefractIndex', null)
    };

    if (ret.CoatRoughness !== null) {
        ret.CoatRoughness = parseFloat(ret.CoatRoughness);
    }

    // console.log(ret);
    return ret;
}

function setMCodeValue(controlId, value, changeClassIfNone) {

    let ctrl = $('#' + controlId);

    if (value === null || value === undefined) {
        value = 'None';
        if (changeClassIfNone) {
            ctrl.parent().addClass('none');
        }
    } else if (changeClassIfNone) {
        ctrl.parent().removeClass('none');
    }

    ctrl.text(value);
}

function map(n, start1, stop1, start2, stop2) {
  return ((n-start1)/(stop1-start1))*(stop2-start2)+start2;
}

function loadMCode(gpath, tpath, fpath, cpath) {
    let mcode = getMCode(gpath, tpath, fpath, cpath);

    let CoatRoughness;

    if (mcode.CoatRoughness === null) {
        CoatRoughness = 1.0;
    } else {
        CoatRoughness = mcode.CoatRoughness;
    }

    base_roughness_slider.val(mcode.BaseRoughness * 100);
    coat_roughness_slider.val(CoatRoughness * 100);
    updateImageFromSliders();

    // set real values
    setMCodeValue('base_roughness_value', mcode.BaseRoughness, true);
    setMCodeValue('coat_roughness_value', mcode.CoatRoughness, true);

    // map a red color if Likelyhood is too low
    // if (mcode.Likelyhood < 0.5) {
    //     let red = parseInt(map(mcode.Likelyhood, 0, 0.5, 255, 0));
    //     $('#LikelyHood').parent().css('color', 'rgb(' + red + ',0,0)');
    // } else {
    //     $('#LikelyHood').parent().css('color', '');
    // }

    setMCodeValue('NbLayers', mcode.NbLayers, true);
    setMCodeValue('LikelyHood', mcode.Likelyhood, true);
    setMCodeValue('BaseRoughness', mcode.BaseRoughness, true);
    setMCodeValue('BaseRefractIndex', mcode.BaseRefractIndex, true);
    setMCodeValue('CoatRoughness', mcode.CoatRoughness, true);
    setMCodeValue('CoatRefractIndex', mcode.CoatRefractIndex, true);

    $('#mcode').text(mcode.MCode);
    $('.mcode').css('visibility', 'visible')

    setMCodeValue('CombinedRoughness',
        combineRoughness(mcode.BaseRoughness, CoatRoughness, mcode.NbLayers), true);

    if (mcode.NbLayers == 1) {
        $('#CombinedRoughnessLabel').css('visibility', 'visible');
    } else {
        $('#CombinedRoughnessLabel').css('visibility', 'visible');
    }
}

function combineRoughness(base, coat, nbLayers) {
    if (nbLayers == 2) {
        return base * 0.25 + coat * 0.75;
    }

    return base;
}

function getCombinedRoughness(order) {
    const l = parseInt(getVal(order, 'NbLayers', '1'));
    const cr = parseFloat(getVal(order, 'CoatRoughness', '1'));
    const br = parseFloat(getVal(order, 'BaseRoughness', '0'));
    return combineRoughness(br, cr, l);
}

function getRoughnessComparer(order) {
    return (a, b) => {

        let orderA = [a].concat(order);
        const crA = parseFloat(getVal(orderA, 'CoatRoughness', '1'));
        const brA = parseFloat(getVal(orderA, 'BaseRoughness', '0'));

        let orderB = [b].concat(order);
        const crB = parseFloat(getVal(orderB, 'CoatRoughness', '1'));
        const brB = parseFloat(getVal(orderB, 'BaseRoughness', '0'));

        if (crA < crB) {
            return 1;
        } else if (crA > crB) {
            return -1;
        } else if (brA < brB) {
            return 1;
        } else if (brA > brB) {
            return -1;
        } else {
            let aname = a.getAttribute('name');
            let bname = b.getAttribute('name');

            if (aname < bname) {
                return -1;
            } else if (aname > bname) {
                return 1;
            } else {
                return 0;
            }
        }
    };
}

function roughnessComparer(a, b) {
    const ar = getCombinedRoughness([a])
    const br = getCombinedRoughness([b])
    let aname = a.getAttribute('name');
    let bname = b.getAttribute('name');

    console.log(aname, ar)

    if (ar < br) {
        return 1;
    } else if (ar > br) {
        return -1;
    } else {
        let aname = a.getAttribute('name');
        let bname = b.getAttribute('name');

        if (aname < bname) {
            return -1;
        } else if (aname > bname) {
            return 1;
        } else {
            return 0;
        }
    }
}

function onCoatingChanged() {
    loadMCode(
        groupListbox.val(),
        typeListbox.val(),
        finishListbox.val(),
        coatingListbox.val());
}

function onFinishChanged() {
    loadCoatings(
        groupListbox.val(),
        typeListbox.val(),
        finishListbox.val());
}

function onTypeChanged() {
    loadFinishes(
        groupListbox.val(),
        typeListbox.val());
}

function onGroupChanged() {
    loadTypes(
        groupListbox.val());
}

function loadCoatings(gpath, tpath, fpath) {
    let group = $(CommonMaterialMap).xpath(gpath)[0];
    let type = $(CommonMaterialMap).xpath(tpath)[0];
    let finish = $(CommonMaterialMap).xpath(fpath)[0];
    let gname = group.getAttribute('name');
    let tname = type.getAttribute('name');
    let fname = finish.getAttribute('name');
    let oldSelection = coatingListbox.find(':selected').text();
    coatingListbox.empty();

    let coatings = $(finish).xpath('Coatings/Coating');
    if (coatings.length == 0) {
        coatings = $(finish).xpath('Coating');
        if (coatings.length == 0) {
            coatings = $(type).xpath('Coatings/Coating');
            if (coatings.length == 0) {
                coatings = $(type).xpath('Coating');
                if (coatings.length == 0) {
                    coatings = $(group).xpath('Coatings/Coating')
                    if (coatings.length == 0) {
                        coatings = $(group).xpath('Coating');
                    }
                }
            }
        }
    }

    let sel, first;
    let sorted = sortLists ? coatings.sort(getRoughnessComparer([finish, type, group])) : coatings;

    for (let i = 0; i != sorted.length; ++i) {

        let coating = sorted[i];
        let cname = coating.getAttribute('name');
        let currentPath = getNodePath(coating);

        let opt = $('<option />', { value: currentPath, text: cname });
        opt.appendTo(coatingListbox);

        if (cname == oldSelection) {
            sel = opt;
        }
        if (i == 0) {
            first = opt;
        }
    }

    let opt = sel || first;
    opt.prop('selected', true);
    onCoatingChanged();
}

function loadFinishes(gpath, tpath) {
    let group = $(CommonMaterialMap).xpath(gpath)[0];
    let type = $(CommonMaterialMap).xpath(tpath)[0];
    let gname = group.getAttribute('name');
    let tname = type.getAttribute('name');
    let oldSelection = finishListbox.find(':selected').text();;
    finishListbox.empty();

    let finishes = $(type).xpath('Finishes/Finish');
    if (finishes.length == 0) {
        finishes = $(type).xpath('Finish');
        if (finishes.length == 0) {
            finishes = $(group).xpath('Finishes/Finish')
            if (finishes.length == 0) {
                finishes = $(group).xpath('Finish');
            }
        }
    }

    let sel, first;
    let sorted = sortLists ? finishes.sort(getRoughnessComparer([type, group])) : finishes;

    for (let i = 0; i < sorted.length; ++i) {

        let finish = sorted[i];
        let fname = finish.getAttribute('name');
        let currentPath = getNodePath(finish);

        let opt = $('<option />', { value: currentPath, text: fname });
        opt.appendTo(finishListbox);

        if (fname == oldSelection) {
            sel = opt;
        }
        if (i == 0) {
            first = opt;
        }
    }

    let opt = sel || first;
    opt.prop('selected', true);
    onFinishChanged();
}

function loadTypes(gpath) {
    let group = $(CommonMaterialMap).xpath(gpath)[0];
    let gname = group.getAttribute('name');
    let oldSelection = typeListbox.find(':selected').text();
    typeListbox.empty();

    let types = $(group).xpath('Types/Type');
    let sel, first;

    for (let i = 0; i != types.length; ++i) {
        let type = types[i];
        let tname = type.getAttribute('name');
        let currentPath = getNodePath(type);

        let opt = $('<option />', { value: currentPath, text: tname });
        opt.appendTo(typeListbox);

        if (tname == oldSelection) {
            sel = opt;
        }
        if (i == 0) {
            first = opt;
        }
    }

    let opt = sel || first;
    opt.prop('selected', true);
    onTypeChanged();
}

function loadGroups() {
    let nodes = $(CommonMaterialMap).xpath('//Group');
    groupListbox.empty();

    for (let i = 0; i != nodes.length; ++i) {
        let group = nodes[i];
        let gname = group.getAttribute('name');
        let currentPath = getNodePath(group);

        opt = $('<option />', { value: currentPath, text: gname, selected: i == 0 });
        opt.appendTo(groupListbox);
    }

    onGroupChanged();
}

function getImageFilename(base, coat) {
    let b = Math.floor(parseInt(base) / 100);
    let c = Math.floor(parseInt(coat) / 100);
    let baseName = 'Base ' + b + ',' + ('00' + base).slice(-2);
    let coatName = 'Coat ' + c + ',' + ('00' + coat).slice(-2);
    return 'src', 'Roughness Scale - ' + baseName + ' - ' + coatName + '.jpg';
}

function updateImageFromSliders() {
    let image = $('#image');
    let fname = getImageFilename(base_roughness_slider.val(), coat_roughness_slider.val());
    image.addClass('loading');
    image.attr('src', fname);
}

function onSliderChange() {
    updateImageFromSliders();
    base_roughness_value.text(base_roughness_slider.val() / 100);
    coat_roughness_value.text(coat_roughness_slider.val() / 100);
    $('.mcode').css('visibility', 'hidden');
    base_roughness_value.parent().removeClass('none');
    coat_roughness_value.parent().removeClass('none');
}
