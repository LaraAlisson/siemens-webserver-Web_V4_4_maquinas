"use strict";
var hostAddress = null;
var userToken = null;
var pollingTimer = null;
var isInitialized = false;
var URL = "lib/SetupEncoderMaqD.json";

$(document).ready(function() {
	$("#NumeroSAPmaqD, #NumeroSAPmaqDButton, #velocidadeMaqD, #velocidadeMaqDButton, #confMetrosRodadosMaqD, #confMetrosRodadosMaqDButton, #leituraEncoderMaqD, #leituraEncoderMaqDButton, #circuferenciaRoloMaqD, #circuferenciaRoloMaqDButton").prop("disabled", true);

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

$.init = function() {
	if (isInitialized) return;
	isInitialized = true;

	S7Framework.readData(URL, "init read data", deployValues);

	$("#metrosRodadosMaqDButton").off("click").on("click", function() {
		var metrosRodados = $.trim($("#metrosRodadosMaqD").val());
		if (!metrosRodados || isNaN(metrosRodados)) {
			alert("Informe um valor numérico válido para metros rodados.");
			return;
		}
		var data = '"DadosCalibracao".metrosRodadosMaqD=' + metrosRodados;
		S7Framework.writeData(URL, data, "METROSRODADOSMAQD", function() {
			$("#metrosRodadosMaqD").val("");
		});
	});

	$("#CalButtonMqD").off("click").on("click", function() {
		var data = '"DadosCalibracao".habilitaCalibracaoMaqD=1';
		S7Framework.writeData(URL, data, "HABILITACALIBRACAOMAQD");
	});

	$("#resetEncButtonMqD").off("click").on("click", function() {
		var data = '"DadosCalibracao".resetEncoderMaqD=1';
		S7Framework.writeData(URL, data, "RESETENCODERMAQD");
	});
};

function deployValues(values) {
	if (values && values.length >= 6) {
		$('#actNumeroSAPmaqD').html(values[0]);
		$('#actVelocidadeMaqD').html(values[1]);
		$('#actMetrosRodadosMaqD').html(values[2]);
		$('#idConfMetrosRodadosMaqD').html(values[3]);
		$('#actLeituraEncoderMaqD').html(values[4]);
		$('#actCircuferenciaRoloMaqD').html(values[5]);
	}
	if (pollingTimer) clearTimeout(pollingTimer);
	pollingTimer = setTimeout(function() {
		S7Framework.readData(URL, "init read data", deployValues);
	}, 2000);
}