"use strict";
var hostAddress = null;
var userToken = null;
var pollingTimer = null;
var isInitialized = false;
var URL = "lib/StartMaqD.json";

$(document).ready(function() {
	var urlParameter = getUrlParameter();
	var tokenParam = urlParameter["userToken"];
	var hostParam = urlParameter["hostAddress"];
	if (tokenParam && hostParam) {
		userToken = tokenParam;
		hostAddress = hostParam;
		updateWebpage();
	} else {
		window.location.href = "StartApi.html";
	}
	window.onerror = function(message) {
		if (typeof toastr !== "undefined") {
			toastr.error(message, "Error", { "timeOut": "3000" });
		}
	};
});

function getUrlParameter() {
	var parameter = {};
	window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(match, key, value) {
		parameter[key] = decodeURIComponent(value);
	});
	return parameter;
}

function updateWebpage() {
	if (document.getElementById('voltar')) {
		document.getElementById('voltar').setAttribute("href", "StartApi.html?userToken=" + encodeURIComponent(userToken) + "&hostAddress=" + encodeURIComponent(hostAddress));
		S7Framework.initAuto("#loading_div", $.init);
	}
}

function writeSequential(items, index, onComplete) {
	if (index >= items.length) {
		if (typeof onComplete === "function") onComplete();
		return;
	}
	var item = items[index];
	S7Framework.writeData(URL, item.data, item.label, function() {
		writeSequential(items, index + 1, onComplete);
	}, function() {
		writeSequential(items, index + 1, onComplete);
	});
}

$.init = function() {
	if (isInitialized) return;
	isInitialized = true;

	S7Framework.readData(URL, "init read data", deployValues);

	$("#numeroClpButtonD").off("click").on("click", function() {
		var numeroClp = $.trim($("#numeroClpD").val());
		if (!numeroClp || isNaN(numeroClp)) {
			alert("Informe um número de controlador (CLP) válido.");
			return;
		}
		var queue = [
			{ data: '"DataMaquinaD".numeroClpD=' + numeroClp,                           label: "NUMEROCLPD" },
			{ data: '"DataMaquinaD".topicoPublicaMaqD=' + numeroClp + "/dados",    label: "TOPICOPUBLICAMAQD" },
			{ data: '"DataMaquinaD".topicoInscreve01MaqD=' + numeroClp + "/liberar", label: "TOPICOINCREVE01MAQD" },
			{ data: '"DataMaquinaD".topicoInscreve02MaqD=' + numeroClp + "/op",      label: "TOPICOINSCREVE02MAQD" }
		];
		writeSequential(queue, 0, function() { $("#numeroClpD").val(""); });
	});

	$("#numeroSapButtonD").off("click").on("click", function() {
		var numeroSAP = $.trim($("#numeroSapD").val());
		if (!numeroSAP || isNaN(numeroSAP)) {
			alert("Informe um número SAP válido.");
			return;
		}
		var codMaq = '{"COD_MAQ":"';
		var queue = [
			{ data: '"DataMaquinaD".dadosInputMaqD[0]=' + numeroSAP,                            label: "DADOSINPUTMAQD[0]" },
			{ data: '"DataMaquinaD".mensagemOp01MaqD=' + codMaq + numeroSAP + '","TROCA_OP":1}',  label: "MENSAGEMOP01MAQD" },
			{ data: '"DataMaquinaD".mensagemOp00MaqD=' + codMaq + numeroSAP + '","TROCA_OP":0}',  label: "MENSAGEMOP00MAQD" },
			{ data: '"DataMaquinaD".mensagemLib01MaqD=' + codMaq + numeroSAP + '","LIB_MAQ":1}',  label: "MENSAGEMLIB01MAQD" },
			{ data: '"DataMaquinaD".mensagemLib00MaqD=' + codMaq + numeroSAP + '","LIB_MAQ":0}',  label: "MENSAGEMLIB00MAQD" }
		];
		writeSequential(queue, 0, function() { $("#numeroSapD").val(""); });
	});

	$("#encoderButtonD").off("click").on("click", function() {
		var encoder = $.trim($("#encoderD").val());
		if (!encoder || isNaN(encoder)) {
			alert("Informe um valor de PPR do encoder válido.");
			return;
		}
		var data = '"DadosCalibracao".qtdPulsosEncoderMaqD=' + encoder;
		S7Framework.writeData(URL, data, "QTDPULSOSENCODERMAQD", function() {
			$("#encoderD").val("");
		});
	});

	$("#ipButtonMedidorD").off("click").on("click", function() {
		var ip01 = $.trim($("#ip01D").val());
		var ip02 = $.trim($("#ip02D").val());
		var ip03 = $.trim($("#ip03D").val());
		var ip04 = $.trim($("#ip04D").val());
		if (!ip01 || !ip02 || !ip03 || !ip04 || isNaN(ip01) || isNaN(ip02) || isNaN(ip03) || isNaN(ip04)) {
			alert("Preencha todos os 4 campos do endereço IP com números válidos.");
			return;
		}
		var queue = [
			{ data: '"ConfigIPMedidorEnergia".ipMedidorEnergiaMaqD[1]=' + ip01, label: "IPMEDIDORENERGIAMAQD[1]" },
			{ data: '"ConfigIPMedidorEnergia".ipMedidorEnergiaMaqD[2]=' + ip02, label: "IPMEDIDORENERGIAMAQD[2]" },
			{ data: '"ConfigIPMedidorEnergia".ipMedidorEnergiaMaqD[3]=' + ip03, label: "IPMEDIDORENERGIAMAQD[3]" },
			{ data: '"ConfigIPMedidorEnergia".ipMedidorEnergiaMaqD[4]=' + ip04, label: "IPMEDIDORENERGIAMAQD[4]" }
		];
		writeSequential(queue, 0, function() {
			$("#ip01D, #ip02D, #ip03D, #ip04D").val("");
		});
	});
};

function deployValues(values) {
	if (values && values.length >= 7) {
		var nCpu = values[0];
		if (values[0] < 10) nCpu = '000' + values[0];
		else if (values[0] < 100) nCpu = '00' + values[0];
		else if (values[0] < 1000) nCpu = '0' + values[0];

		$('#actNumeroClpD').html(nCpu);
		$('#numeroMaquinaD').html(values[1]);
		$('#pulsosEncoderPPRD').html(values[2]);
		$('#id1D').html(values[3] + '.' + values[4] + '.' + values[5] + '.' + values[6]);
	}
	if (pollingTimer) clearTimeout(pollingTimer);
	pollingTimer = setTimeout(function() {
		S7Framework.readData(URL, "init read data", deployValues);
	}, 2000);
}