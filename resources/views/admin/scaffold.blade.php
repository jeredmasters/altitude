@extends('admin.layout')

@section('content')
<div class="col-lg-12">
    <a href="/admin/users" class="btn btn-default">
        <span class="glyphicon glyphicon-triangle-left" aria-hidden="true"></span>
        Users
    </a>
    <table class="table table-striped">
        <tr>
            <th>
                Created Date
            </th>
            <td>
                {{$scaffold->created_at}}
            </td>
        </tr>
        <tr>
            <th>
                Title
            </th>
            <td>
                {{$scaffold->email}}
            </td>
        </tr>
        <tr>
            <th>
                Objects
            </th>
            <td>
                @foreach ($data['objects'] as $object)
                <a href="/admin/users/{{$object->key}}">{{$object->title}}</a>
                <br />
                @endforeach
            </td>
        </tr>
    </table>
    <hr />
</div>

@stop