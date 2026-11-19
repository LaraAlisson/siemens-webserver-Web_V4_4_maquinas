"use strict";
var hostAddress = null;
var userToken = null;
var pollingTimer = null;
var isInitialized = false;
var URL = "lib/SetupEncoderMaqB.json";

$(document).ready(function() {
	$("#NumeroSAPmaqB, #NumeroSAPmaqBButton, #velocidadeMaqB, #velocidadeMaqBButton, #confMetrosRodadosMaqB, #confMetrosRodadosMaqBButton, #leituraEncoderMaqB, #leituraEncoderMaqBButton, #circuferenciaRoloMaqB, #circuferenciaRoloMaqBButton").prop("disabled", true);

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

	$("#metrosRodadosMaqBButton").off("click").on("click", function() {
		var metrosRodados = $.trim($("#metrosRodadosMaqB").val());
		if (!metrosRodados || isNaN(metrosRodados)) {
			alert("Informe um valor numérico válido para metros rodados.");
			return;
		}
		var data = '"DadosCalibracao".metrosRodadosMaqB=' + metrosRodados;
		S7Framework.writeData(URL, data, "METROSRODADOSMAQB", function() {
			$("#metrosRodadosMaqB").val("");
		});
	});

	$("#CalButtonMqB").off("click").on("click", function() {
		var data = '"DadosCalibracao".habilitaCalibracaoMaqB=1';
		S7Framework.writeData(URL, data, "HABILITACALIBRACAOMAQB");
	});

	$("#resetEncButtonMqB").off("click").on("click", function() {
		var data = '"DadosCalibracao".resetEncoderMaqB=1';
		S7Framework.writeData(URL, data, "RESETENCODERMAQB");
	});
};

function deployValues(values) {
	if (values && values.length >= 6) {
		$('#actNumeroSAPmaqB').html(values[0]);
		$('#actVelocidadeMaqB').html(values[1]);
		$('#actMetrosRodadosMaqB').html(values[2]);
		$('#idConfMetrosRodadosMaqB').html(values[3]);
		$('#actLeituraEncoderMaqB').html(values[4]);
		$('#actCircuferenciaRoloMaqB').html(values[5]);
	}
	if (pollingTimer) clearTimeout(pollingTimer);
	pollingTimer = setTimeout(function() {
		S7Framework.readData(URL, "init read data", deployValues);
	}, 2000);
}